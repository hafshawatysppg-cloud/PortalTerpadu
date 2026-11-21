import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

type FirebaseErrorListener = (message: string) => void;
const errorListeners = new Set<FirebaseErrorListener>();
let lastToastMessage = '';
let lastToastAt = 0;

export function subscribeFirebaseErrorToast(listener: FirebaseErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function emitFirebaseErrorToast(message: string): void {
  const now = Date.now();
  // Hindari spam notifikasi identik dalam 3 detik
  if (message === lastToastMessage && now - lastToastAt < 3000) {
    return;
  }
  lastToastMessage = message;
  lastToastAt = now;
  errorListeners.forEach((cb) => {
    try {
      cb(message);
    } catch (_) {}
  });
}

export function formatFirestoreErrorMessage(error: unknown, customContext?: string): string {
  const rawMsg = error instanceof Error ? error.message : String(error || 'Kesalahan tidak diketahui');
  const lower = rawMsg.toLowerCase();

  let reason = 'Gagal terhubung ke server Firebase Firestore.';
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    reason = 'Akses ke Firebase ditolak oleh aturan keamanan (Security Rules).';
  } else if (lower.includes('resource-exhausted') || lower.includes('quota')) {
    reason = 'Kuota harian Firebase Firestore tercapai.';
  } else if (lower.includes('offline') || lower.includes('unavailable') || lower.includes('network')) {
    reason = 'Koneksi internet atau layanan Firebase sedang tidak tersedia.';
  } else if (lower.includes('invalid-argument') || lower.includes('too large') || lower.includes('exceeds the maximum')) {
    reason = 'Ukuran atau format data melebihi batas dokumen Firestore.';
  }

  return customContext ? `${customContext}: ${reason}` : reason;
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  options?: { notify?: boolean; customContext?: string; throwError?: boolean }
): string {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error:', JSON.stringify(errInfo), error);

  const friendlyMsg = formatFirestoreErrorMessage(error, options?.customContext);
  if (options?.notify !== false) {
    emitFirebaseErrorToast(friendlyMsg);
  }

  if (options?.throwError !== false) {
    throw new Error(JSON.stringify(errInfo));
  }
  return friendlyMsg;
}

export function notifyFirestoreFailure(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  customContext?: string
): string {
  return handleFirestoreError(error, operationType, path, {
    notify: true,
    customContext,
    throwError: false,
  });
}

export function generateUniqueDocId(prefix: string): string {
  const safePrefix = String(prefix || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now().toString(36);
  let randomPart = '';
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    }
  } catch (_) {}
  if (!randomPart) {
    randomPart = `${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${safePrefix}_${timestamp}_${randomPart}`;
}

export function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error || '');
    if (msg.includes('the client is offline') || msg.toLowerCase().includes('unavailable')) {
      console.error('Koneksi Firebase gagal. Periksa konfigurasi Firebase Anda:', error);
      emitFirebaseErrorToast('Gagal terhubung ke Firebase Firestore. Periksa koneksi internet Anda.');
      return false;
    }
    return true;
  }
}
