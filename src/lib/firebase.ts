import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel, type Firestore } from 'firebase/firestore';
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
    try {
      const dbId = (firebaseConfig as any).firestoreDatabaseId;
      if (dbId) {
        _db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        }, dbId);
      } else {
        _db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
      }
    } catch (_err) {
      _db = (firebaseConfig as any).firestoreDatabaseId 
        ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
        : getFirestore(app);
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

