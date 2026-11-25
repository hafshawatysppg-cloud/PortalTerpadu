import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';

let adminAuth: Auth | null = null;

try {
  let projectId = process.env.FIREBASE_PROJECT_ID || '';
  if (!projectId) {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      projectId = cfg?.projectId || '';
    }
  }

  if (!getApps().length) {
    initializeApp(projectId ? { projectId } : undefined);
  }
  adminAuth = getAuth();
} catch (err: any) {
  console.warn('[Firebase Admin] Inisialisasi opsional dilewati:', err?.message || err);
  adminAuth = null;
}

export { adminAuth };
