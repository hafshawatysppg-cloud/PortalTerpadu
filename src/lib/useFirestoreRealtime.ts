import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { getDb } from './firebase';
import { safeParseJson } from './safeJson';
import {
  OperationType,
  isFirestoreQuotaError,
  isFirestoreQuotaExhausted,
  markFirestoreQuotaExhausted,
  notifyFirestoreFailure
} from './firestoreHelper';

interface CollectionStoreEntry<T> {
  data: T[];
  hasData: boolean;
  error: string | null;
  subscribers: Set<(items: T[], err: string | null) => void>;
  unsubscribe: (() => void) | null;
  detachTimer: ReturnType<typeof setTimeout> | null;
  quotaHit: boolean;
  fallbackInFlight: boolean;
  lastFingerprint: string;
}

const collectionRegistry = new Map<string, CollectionStoreEntry<any>>();
const DETACH_GRACE_MS = 20_000;

function computeItemsFingerprint<T>(items: T[]): string {
  try {
    return JSON.stringify(items);
  } catch {
    return String(items.length);
  }
}

function teardownAllRegistryListeners(): void {
  collectionRegistry.forEach((entry) => {
    entry.quotaHit = true;
    if (entry.unsubscribe) {
      try {
        entry.unsubscribe();
      } catch {}
      entry.unsubscribe = null;
    }
  });
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
    console.warn(`Server fallback read warning for [${collectionName}]:`, err);
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

function updateEntryData<T>(entry: CollectionStoreEntry<T>, items: T[], clearError = false): boolean {
  const nextFp = computeItemsFingerprint(items);
  const errorChanged = clearError && entry.error !== null;
  if (entry.hasData && nextFp === entry.lastFingerprint && !errorChanged) {
    return false;
  }
  entry.data = items;
  entry.hasData = true;
  entry.lastFingerprint = nextFp;
  if (clearError) {
    entry.error = null;
  }
  notifySubscribers(entry);
  return true;
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
      quotaHit: false,
      fallbackInFlight: false,
      lastFingerprint: ''
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

  if (!entry.hasData && !entry.fallbackInFlight) {
    entry.fallbackInFlight = true;
    const runFallback = async () => {
      try {
        const serverItems = await fetchServerCollectionFallback<T>(collectionName);
        if (serverItems && serverItems.length > 0 && !entry.hasData) {
          updateEntryData(entry, serverItems);
          return;
        }
        if (fallbackFetch) {
          try {
            const customItems = await fallbackFetch();
            if (Array.isArray(customItems) && !entry.hasData) {
              updateEntryData(entry, customItems);
            }
          } catch (err) {
            console.warn(`Fallback fetch warning for [${collectionName}]:`, err);
          }
        } else if (serverItems && !entry.hasData) {
          updateEntryData(entry, serverItems);
        }
      } finally {
        entry.fallbackInFlight = false;
      }
    };
    void runFallback();
  }

  if (entry.unsubscribe || entry.quotaHit || isFirestoreQuotaExhausted()) {
    if (isFirestoreQuotaExhausted()) {
      entry.quotaHit = true;
    }
    return;
  }

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
        entry.quotaHit = false;
        updateEntryData(entry, items, true);
      },
      (err) => {
        const isTransientStreamDrop =
          err?.message?.includes('RST_STREAM') ||
          err?.message?.includes('Code: 13') ||
          err?.message?.includes('client is offline') ||
          err?.message?.includes('Internal server error');

        if (isFirestoreQuotaError(err)) {
          markFirestoreQuotaExhausted();
          teardownAllRegistryListeners();
          notifyFirestoreFailure(
            err,
            OperationType.LIST,
            collectionName,
            `Gagal sinkronisasi data [${collectionName}] dari Firebase`
          );
          if (entry.error !== null) {
            entry.error = null;
            notifySubscribers(entry);
          }
        } else {
          const errMsg = notifyFirestoreFailure(
            err,
            OperationType.LIST,
            collectionName,
            isTransientStreamDrop
              ? `Koneksi real-time ke [${collectionName}] terganggu`
              : `Gagal sinkronisasi data [${collectionName}] dari Firebase`
          );
          if (entry.error !== errMsg) {
            entry.error = errMsg;
            notifySubscribers(entry);
          }
        }

        if (!entry.fallbackInFlight) {
          entry.fallbackInFlight = true;
          const recoverFromServer = async () => {
            try {
              const serverItems = await fetchServerCollectionFallback<T>(collectionName);
              if (serverItems && serverItems.length > 0) {
                updateEntryData(entry, serverItems, true);
                return;
              }
              if (fallbackFetch) {
                try {
                  const res = await fallbackFetch();
                  if (Array.isArray(res)) {
                    updateEntryData(entry, res, true);
                  }
                } catch (fallbackErr) {
                  console.warn(`Recovery fallback warning for [${collectionName}]:`, fallbackErr);
                }
              } else if (serverItems) {
                updateEntryData(entry, serverItems, true);
              }
            } finally {
              entry.fallbackInFlight = false;
            }
          };
          void recoverFromServer();
        }
      }
    );
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) {
      markFirestoreQuotaExhausted();
      teardownAllRegistryListeners();
    }
    const errMsg = notifyFirestoreFailure(
      err,
      OperationType.LIST,
      collectionName,
      `Gagal menginisialisasi koneksi Firestore [${collectionName}]`
    );
    if (!isFirestoreQuotaError(err) && entry.error !== errMsg) {
      entry.error = errMsg;
      notifySubscribers(entry);
    }
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
  const [error, setError] = useState<string | null>(() => entry.error);

  useEffect(() => {
    let isMounted = true;
    const currentEntry = getOrCreateEntry<T>(collectionName);

    if (currentEntry.hasData) {
      setData((prev) => (prev === currentEntry.data ? prev : currentEntry.data));
      setLoading((prev) => (prev ? false : prev));
    }
    if (currentEntry.error !== null) {
      setError((prev) => (prev === currentEntry.error ? prev : currentEntry.error));
    }

    const subscriber = (items: T[], err: string | null) => {
      if (!isMounted) return;
      setData((prev) => (prev === items ? prev : items));
      setError((prev) => (prev === err ? prev : err));
      setLoading((prev) => (prev ? false : prev));
    };

    currentEntry.subscribers.add(subscriber);
    ensureSharedListener(collectionName, currentEntry, fallbackFetch);

    const loadingSafetyTimer = setTimeout(() => {
      if (isMounted) setLoading((prev) => (prev ? false : prev));
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
      updateEntryData(currentEntry, nextValue);
    },
    [collectionName]
  );

  return { data, setData: setCachedData, loading, error };
}
