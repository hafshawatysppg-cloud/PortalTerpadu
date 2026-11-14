import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Suppress benign internal transport warnings from Firestore client SDK
try {
  setLogLevel('silent');
} catch (_) {}

let _db: Firestore | null = null;

export const getDb = (): Firestore => {
  if (!_db) {
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    try {
      const settings = {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      };
      _db = dbId ? initializeFirestore(app, settings, dbId) : initializeFirestore(app, settings);
    } catch (_err) {
      try {
        const fallbackSettings = { experimentalForceLongPolling: true };
        _db = dbId
          ? initializeFirestore(app, fallbackSettings, dbId)
          : initializeFirestore(app, fallbackSettings);
      } catch (_err2) {
        _db = dbId ? getFirestore(app, dbId) : getFirestore(app);
      }
    }
  }
  return _db;
};

// Lazy proxy so Firestore is only initialized when actually accessed
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getDb();
    const val = (instance as any)[prop];
    return typeof val === 'function' ? val.bind(instance) : val;
  }
});

export default app;

