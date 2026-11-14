/**
 * Unified Client-to-Google-Cloud Storage Sync Engine
 * Automatically synchronizes all `sppg_*` application state stored in browser `localStorage`
 * (e.g., Master Menu, Siklus Menu, Akuntan RAB/Gaji/Realisasi, Bahan Pangan, Organoleptik, etc.)
 * with the server persistent snapshot & Google Cloud Firestore (`app_state_sync` collection).
 */

const PENDING_CACHE_KEY = 'sppg_fs_cache_pending_appstate';
let initialized = false;
let isApplyingCloudHydration = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const pendingChanges = new Map<string, string | null>();

function isSyncedKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.startsWith('sppg_') &&
    !key.startsWith('sppg_fs_cache_')
  );
}

function savePendingLocally(): void {
  try {
    if (pendingChanges.size === 0) {
      localStorage.removeItem(PENDING_CACHE_KEY);
      return;
    }
    const obj: Record<string, string | null> = {};
    pendingChanges.forEach((v, k) => {
      obj[k] = v;
    });
    originalSetItem?.call(localStorage, PENDING_CACHE_KEY, JSON.stringify(obj));
  } catch (_) {}
}

function loadPendingLocally(): void {
  try {
    const raw = localStorage.getItem(PENDING_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (isSyncedKey(k)) {
          pendingChanges.set(k, v === null ? null : String(v));
        }
      }
    }
  } catch (_) {}
}

let originalSetItem: ((key: string, value: string) => void) | null = null;
let originalRemoveItem: ((key: string) => void) | null = null;

async function flushPendingToCloud(useBeacon = false): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingChanges.size === 0) return;

  const entries: Record<string, string | null> = {};
  pendingChanges.forEach((val, key) => {
    entries[key] = val;
  });

  if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const payload = JSON.stringify({ entries });
      const blob = new Blob([payload], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/v1/cloud/app-state', blob);
      if (queued) {
        pendingChanges.clear();
        savePendingLocally();
        return;
      }
    } catch (_) {}
  }

  try {
    const res = await fetch('/api/v1/cloud/app-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
      keepalive: true
    });
    if (res.ok) {
      for (const key of Object.keys(entries)) {
        if (pendingChanges.get(key) === entries[key]) {
          pendingChanges.delete(key);
        }
      }
      savePendingLocally();
    }
  } catch (_) {
    // Keep in pendingChanges & PENDING_CACHE_KEY to retry on next cycle
  }
}

function scheduleFlush(delayMs = 800): void {
  savePendingLocally();
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingToCloud(false);
  }, delayMs);
}

export async function hydrateAppStateFromCloud(): Promise<void> {
  try {
    // 1. Flush any previously offline-queued edits first so cloud gets latest local work
    if (pendingChanges.size > 0) {
      await flushPendingToCloud(false);
    }

    // 2. Fetch consolidated cloud app-state from server (backed by Firestore + persistent disk snapshot)
    const res = await fetch('/api/v1/cloud/app-state');
    if (!res.ok) return;
    const json = await res.json();
    const cloudData: Record<string, string> = (json && json.data) || {};

    // 3. Push any local-only `sppg_*` keys that are not yet in cloud
    const localToUpload: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !isSyncedKey(key)) continue;
      if (cloudData[key] === undefined) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          localToUpload[key] = val;
        }
      }
    }

    if (Object.keys(localToUpload).length > 0) {
      void fetch('/api/v1/cloud/app-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: localToUpload })
      }).catch(() => {});
    }

    // 4. Hydrate localStorage with authoritative cloud keys (without triggering write-back loop)
    const updatedKeys: string[] = [];
    isApplyingCloudHydration = true;
    try {
      for (const [key, cloudVal] of Object.entries(cloudData)) {
        if (!isSyncedKey(key) || typeof cloudVal !== 'string') continue;
        // Skip overwriting if there is an active local pending edit for this key
        if (pendingChanges.has(key)) continue;
        const currentLocal = localStorage.getItem(key);
        if (currentLocal !== cloudVal) {
          originalSetItem?.call(localStorage, key, cloudVal);
          updatedKeys.push(key);
        }
      }
    } finally {
      isApplyingCloudHydration = false;
    }

    if (updatedKeys.length > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sppg-cloud-synced', { detail: { keys: updatedKeys } }));
      // Trigger storage listeners cleanly
      for (const key of updatedKeys) {
        try {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key,
              newValue: cloudData[key]
            })
          );
        } catch (_) {}
      }
    }
  } catch (_) {
    // Non-fatal: app keeps working with local cache
  }
}

export async function forceFullCloudSync(): Promise<boolean> {
  try {
    const allLocal: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isSyncedKey(key)) {
        const val = localStorage.getItem(key);
        if (val !== null) allLocal[key] = val;
      }
    }
    const res = await fetch('/api/v1/cloud/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: allLocal, forcePull: false })
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export function initCloudStorageSync(): void {
  if (initialized || typeof window === 'undefined' || typeof Storage === 'undefined') return;
  initialized = true;

  originalSetItem = Storage.prototype.setItem;
  originalRemoveItem = Storage.prototype.removeItem;

  loadPendingLocally();

  Storage.prototype.setItem = function (key: string, value: string): void {
    originalSetItem!.call(this, key, value);
    if (this === window.localStorage && !isApplyingCloudHydration && isSyncedKey(key)) {
      const strVal = String(value);
      pendingChanges.set(key, strVal);
      scheduleFlush(800);
    }
  };

  Storage.prototype.removeItem = function (key: string): void {
    originalRemoveItem!.call(this, key);
    if (this === window.localStorage && !isApplyingCloudHydration && isSyncedKey(key)) {
      pendingChanges.set(key, null);
      scheduleFlush(800);
    }
  };

  window.addEventListener('pagehide', () => {
    void flushPendingToCloud(true);
  });
  window.addEventListener('beforeunload', () => {
    void flushPendingToCloud(true);
  });
  window.addEventListener('online', () => {
    void flushPendingToCloud(false);
  });

  // Start initial bidirectional sync asynchronously so initial render stays instant
  void hydrateAppStateFromCloud();
}
