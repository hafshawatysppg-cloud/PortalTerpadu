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

// Tampilkan pesan error Firestore (mis. kegagalan sync cloud atau Security Rules) di console browser
try {
  setLogLevel('error');
} catch (_) {}

const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

function createFirestoreInstance(): Firestore {
  try {
    const settings = {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };
    return dbId ? initializeFirestore(app, settings, dbId) : initializeFirestore(app, settings);
  } catch (_err) {
    try {
      const fallbackSettings = { experimentalForceLongPolling: true };
      return dbId
        ? initializeFirestore(app, fallbackSettings, dbId)
        : initializeFirestore(app, fallbackSettings);
    } catch (_err2) {
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
  }
}

export const db: Firestore = createFirestoreInstance();

export const getDb = (): Firestore => db;

export default app;

