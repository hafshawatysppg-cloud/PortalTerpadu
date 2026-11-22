import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getDb } from './firebase';
import { safeParseJson } from './safeJson';
import { OperationType, notifyFirestoreFailure } from './firestoreHelper';

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
const DETACH_GRACE_MS = 20_000;

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
    const json = await safeParseJson<{ data?: T[] }>(res);
    if (json && Array.isArray(json.data)) {
      return json.data as T[];
    }
    return null;
  } catch (err) {
    console.error(`Server fallback read error for [${collectionName}]:`, err);
    return null;
  }
}

function notifySubscribers<T>(entry: CollectionStoreEntry<T>): void {
  entry.subscribers.forEach((cb) => {
    try {
      cb(entry.data, entry.error);
    } catch (_) {}
  });
}

function getOrCreateEntry<T>(collectionName: string): CollectionStoreEntry<T> {
  let entry = collectionRegistry.get(collectionName) as CollectionStoreEntry<T> | undefined;
  if (!entry) {
    entry = {
      data: [],
      hasData: false,
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

  if (!entry.hasData) {
    const runFallback = async () => {
      const serverItems = await fetchServerCollectionFallback<T>(collectionName);
      if (serverItems && serverItems.length > 0 && !entry.hasData) {
        entry.data = serverItems;
        entry.hasData = true;
        notifySubscribers(entry);
        return;
      }
      if (fallbackFetch) {
        try {
          const customItems = await fallbackFetch();
          if (Array.isArray(customItems) && !entry.hasData) {
            entry.data = customItems;
            entry.hasData = true;
            notifySubscribers(entry);
          }
        } catch (err) {
          console.error(`Fallback fetch error for [${collectionName}]:`, err);
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
        }

        const errMsg = notifyFirestoreFailure(
          err,
          OperationType.LIST,
          collectionName,
          isTransientStreamDrop
            ? `Koneksi real-time ke [${collectionName}] terganggu`
            : `Gagal sinkronisasi data [${collectionName}] dari Firebase`
        );
        entry.error = errMsg;
        notifySubscribers(entry);

        const recoverFromServer = async () => {
          const serverItems = await fetchServerCollectionFallback<T>(collectionName);
          if (serverItems && serverItems.length > 0) {
            entry.data = serverItems;
            entry.hasData = true;
            notifySubscribers(entry);
            return;
          }
          if (fallbackFetch) {
            try {
              const res = await fallbackFetch();
              if (res) {
                entry.data = res;
                entry.hasData = true;
                notifySubscribers(entry);
              }
            } catch (fallbackErr) {
              console.error(`Recovery fallback error for [${collectionName}]:`, fallbackErr);
            }
          }
        };
        void recoverFromServer();
      }
    );
  } catch (err: any) {
    entry.error = notifyFirestoreFailure(
      err,
      OperationType.LIST,
      collectionName,
      `Gagal menginisialisasi koneksi Firestore [${collectionName}]`
    );
    notifySubscribers(entry);
  }
}

/**
 * Real-time Firestore collection hook backed directly by onSnapshot and persistentLocalCache
 * (tanpa localStorage caching untuk data operasional).
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

  const setCachedData: Dispatch<SetStateAction<T[]>> = useCallback(
    (updater) => {
      const currentEntry = getOrCreateEntry<T>(collectionName);
      const nextValue =
        typeof updater === 'function' ? (updater as (prev: T[]) => T[])(currentEntry.data) : updater;
      if (nextValue === currentEntry.data) return;
      currentEntry.data = nextValue;
      currentEntry.hasData = true;
      notifySubscribers(currentEntry);
    },
    [collectionName]
  );

  return { data, setData: setCachedData, loading, error };
}
