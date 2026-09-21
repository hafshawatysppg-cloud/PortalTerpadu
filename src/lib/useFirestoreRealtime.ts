import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * Realtime hook that listens to any Firestore collection via onSnapshot.
 * Synchronizes instantly across HP, Laptop, and Desktop.
 * 
 * @param collectionName The name of the Firestore collection
 * @param fallbackFetch Optional fallback async fetcher if Firestore onSnapshot is warming up
 */
export function useFirestoreRealtime<T extends { id: string }>(
  collectionName: string,
  fallbackFetch?: () => Promise<T[]>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    try {
      const firestore = getDb();
      if (firestore) {
        const colRef = collection(firestore, collectionName);
        const q = query(colRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;
            const items: T[] = [];
            snapshot.forEach((doc) => {
              items.push({
                id: doc.id,
                ...doc.data(),
              } as T);
            });
            setData(items);
            setLoading(false);
          },
          (err) => {
            console.warn(`Firestore onSnapshot error on [${collectionName}]:`, err?.message);
            if (isMounted) {
              setError(err.message);
              // Fallback to fetch if available
              if (fallbackFetch) {
                fallbackFetch().then((res) => {
                  if (isMounted && res) {
                    setData(res);
                    setLoading(false);
                  }
                }).catch(() => {
                  if (isMounted) setLoading(false);
                });
              } else {
                setLoading(false);
              }
            }
          }
        );
      } else if (fallbackFetch) {
        fallbackFetch().then((res) => {
          if (isMounted && res) {
            setData(res);
            setLoading(false);
          }
        });
      }
    } catch (err: any) {
      console.warn(`useFirestoreRealtime initialization warning for [${collectionName}]:`, err?.message);
      if (fallbackFetch) {
        fallbackFetch().then((res) => {
          if (isMounted && res) {
            setData(res);
            setLoading(false);
          }
        }).catch(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName]);

  return { data, setData, loading, error };
}
