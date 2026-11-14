import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getDb } from './firebase';

interface CollectionStoreEntry<T> {
  data: T[];
  hasData: boolean;
  error: string | null;
  subscribers: Set<(items: T[], err: string | null) => void>;
  unsubscribe: (() => void) | null;
  detachTimer: ReturnType<typeof setTimeout> | null;
  quotaHit: boolean;
}

const collectionRegistry = new Map<string, CollectionStoreEntry<any>>();
const DETACH_GRACE_MS = 20_000; // Keep listener warm across quick tab switches to cut Firestore reads
const CACHE_KEY_PREFIX = 'sppg_fs_cache_coll_';

function readCachedCollection<T>(collectionName: string): T[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${collectionName}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function writeCachedCollection<T>(collectionName: string, items: T[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(`${CACHE_KEY_PREFIX}${collectionName}`, JSON.stringify(items));
  } catch {
    // Ignore storage quota overflow for large cached collections
  }
}

function isQuotaExceededError(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted')
  );
}

async function fetchServerCollectionFallback<T>(collectionName: string): Promise<T[] | null> {
  try {
    const res = await fetch(`/api/v1/cloud/collection/${encodeURIComponent(collectionName)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      return json.data as T[];
    }
    return null;
  } catch {
    return null;
  }
}

function notifySubscribers<T>(entry: CollectionStoreEntry<T>): void {
  entry.subscribers.forEach((cb) => {
    try {
      cb(entry.data, entry.error);
    } catch {
      // Ignore subscriber render issues
    }
  });
}

function getOrCreateEntry<T>(collectionName: string): CollectionStoreEntry<T> {
  let entry = collectionRegistry.get(collectionName) as CollectionStoreEntry<T> | undefined;
  if (!entry) {
    const cached = readCachedCollection<T>(collectionName);
    entry = {
      data: cached || [],
      hasData: Boolean(cached && cached.length > 0),
      error: null,
      subscribers: new Set(),
      unsubscribe: null,
      detachTimer: null,
      quotaHit: false
    };
    collectionRegistry.set(collectionName, entry);
  }
  return entry;
}

function ensureSharedListener<T extends { id: string }>(
  collectionName: string,
  entry: CollectionStoreEntry<T>,
  fallbackFetch?: () => Promise<T[]>
): void {
  if (entry.detachTimer) {
    clearTimeout(entry.detachTimer);
    entry.detachTimer = null;
  }

  // Always warm from server snapshot cache immediately if no live data yet (0 Firestore reads)
  if (!entry.hasData) {
    const runFallback = async () => {
      const serverItems = await fetchServerCollectionFallback<T>(collectionName);
      if (serverItems && serverItems.length > 0 && !entry.hasData) {
        entry.data = serverItems;
        entry.hasData = true;
        writeCachedCollection(collectionName, serverItems);
        notifySubscribers(entry);
        return;
      }
      if (fallbackFetch) {
        try {
          const customItems = await fallbackFetch();
          if (Array.isArray(customItems) && !entry.hasData) {
            entry.data = customItems;
            entry.hasData = true;
            writeCachedCollection(collectionName, customItems);
            notifySubscribers(entry);
          }
        } catch {
          // Ignore
        }
      }
    };
    void runFallback();
  }

  if (entry.unsubscribe || entry.quotaHit) return;

  try {
    const firestore = getDb();
    if (!firestore) return;

    const colRef = collection(firestore, collectionName);
    const q = query(colRef);

    entry.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...docSnap.data()
          } as T);
        });
        entry.data = items;
        entry.hasData = true;
        entry.error = null;
        entry.quotaHit = false;
        writeCachedCollection(collectionName, items);
        notifySubscribers(entry);
      },
      (err) => {
        const isTransientStreamDrop =
          err?.message?.includes('RST_STREAM') ||
          err?.message?.includes('Code: 13') ||
          err?.message?.includes('client is offline') ||
          err?.message?.includes('Internal server error');

        if (isQuotaExceededError(err)) {
          entry.quotaHit = true;
          if (entry.unsubscribe) {
            try {
              entry.unsubscribe();
            } catch {}
            entry.unsubscribe = null;
          }
        } else if (!isTransientStreamDrop) {
          console.warn(`Firestore onSnapshot notice on [${collectionName}]:`, err?.message);
        }

        const recoverFromServer = async () => {
          const serverItems = await fetchServerCollectionFallback<T>(collectionName);
          if (serverItems && serverItems.length > 0) {
            entry.data = serverItems;
            entry.hasData = true;
            entry.error = null;
            writeCachedCollection(collectionName, serverItems);
            notifySubscribers(entry);
            return;
          }
          if (fallbackFetch) {
            try {
              const res = await fallbackFetch();
              if (res) {
                entry.data = res;
                entry.hasData = true;
                entry.error = null;
                writeCachedCollection(collectionName, res);
                notifySubscribers(entry);
              }
            } catch {
              // Keep cached data
            }
          }
        };
        void recoverFromServer();
      }
    );
  } catch (err: any) {
    console.warn(`useFirestoreRealtime initialization warning for [${collectionName}]:`, err?.message);
  }
}

/**
 * Singleton-cached realtime hook for Firestore collections.
 * Shares one active onSnapshot listener across all mounted components/widgets,
 * caches results locally & on server snapshot, and recovers gracefully if daily quota is hit.
 */
export function useFirestoreRealtime<T extends { id: string }>(
  collectionName: string,
  fallbackFetch?: () => Promise<T[]>
) {
  const entry = getOrCreateEntry<T>(collectionName);
  const [data, setData] = useState<T[]>(() => entry.data);
  const [loading, setLoading] = useState<boolean>(() => !entry.hasData);
  const [error, setError] = useState<string | null>(entry.error);

  useEffect(() => {
    let isMounted = true;
    const currentEntry = getOrCreateEntry<T>(collectionName);

    if (currentEntry.hasData) {
      setData(currentEntry.data);
      setLoading(false);
    }

    const subscriber = (items: T[], err: string | null) => {
      if (!isMounted) return;
      setData(items);
      setError(err);
      setLoading(false);
    };

    currentEntry.subscribers.add(subscriber);
    ensureSharedListener(collectionName, currentEntry, fallbackFetch);

    // Ensure loading doesn't spin forever if collection is legitimately empty
    const loadingSafetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(loadingSafetyTimer);
      currentEntry.subscribers.delete(subscriber);

      if (currentEntry.subscribers.size === 0 && currentEntry.unsubscribe) {
        currentEntry.detachTimer = setTimeout(() => {
          currentEntry.detachTimer = null;
          if (currentEntry.subscribers.size === 0 && currentEntry.unsubscribe) {
            try {
              currentEntry.unsubscribe();
            } catch {}
            currentEntry.unsubscribe = null;
          }
        }, DETACH_GRACE_MS);
      }
    };
  }, [collectionName]);

  const setCachedData: Dispatch<SetStateAction<T[]>> = (updater) => {
    const currentEntry = getOrCreateEntry<T>(collectionName);
    const nextValue =
      typeof updater === 'function' ? (updater as (prev: T[]) => T[])(currentEntry.data) : updater;
    currentEntry.data = nextValue;
    currentEntry.hasData = true;
    writeCachedCollection(collectionName, nextValue);
    notifySubscribers(currentEntry);
  };

  return { data, setData: setCachedData, loading, error };
}
