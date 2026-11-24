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

const QUOTA_STORAGE_KEY = 'sppg_fs_quota_until';
const QUOTA_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown before retrying live Firestore listeners
let quotaExhaustedUntilMs = 0;
let quotaWarnedThisSession = false;

export const FIRESTORE_UPGRADE_URL =
  'https://console.firebase.google.com/project/gen-lang-client-0372936717/firestore/databases/ai-studio-portalterpadu-bbd336b6-0993-456c-8485-a574d85d70cf/data?openUpgradeDialog=true';

function readStoredQuotaUntil(): number {
  if (quotaExhaustedUntilMs > 0) return quotaExhaustedUntilMs;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(QUOTA_STORAGE_KEY);
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > Date.now()) {
          quotaExhaustedUntilMs = parsed;
          return parsed;
        }
        window.sessionStorage.removeItem(QUOTA_STORAGE_KEY);
      }
    }
  } catch (_) {}
  return 0;
}

export function isFirestoreQuotaError(error: unknown): boolean {
  const code = String((error as any)?.code || '').toLowerCase();
  const msg = String(error instanceof Error ? error.message : error || '').toLowerCase();
  return (
    code.includes('resource-exhausted') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('free daily read units') ||
    msg.includes('quota exceeded') ||
    msg.includes('resource_exhausted')
  );
}

export function isFirestoreQuotaExhausted(): boolean {
  const until = readStoredQuotaUntil();
  if (until <= 0) return false;
  if (Date.now() >= until) {
    quotaExhaustedUntilMs = 0;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(QUOTA_STORAGE_KEY);
      }
    } catch (_) {}
    return false;
  }
  return true;
}

export function markFirestoreQuotaExhausted(): boolean {
  const wasAlreadyWarned = quotaWarnedThisSession;
  const nextUntil = Date.now() + QUOTA_COOLDOWN_MS;
  quotaExhaustedUntilMs = nextUntil;
  quotaWarnedThisSession = true;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(QUOTA_STORAGE_KEY, String(nextUntil));
    }
  } catch (_) {}
  return !wasAlreadyWarned;
}

export function resetFirestoreQuotaState(): void {
  quotaExhaustedUntilMs = 0;
  quotaWarnedThisSession = false;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(QUOTA_STORAGE_KEY);
    }
  } catch (_) {}
}

export function subscribeFirebaseErrorToast(listener: FirebaseErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function emitFirebaseErrorToast(message: string): void {
  const now = Date.now();
  // Hindari spam notifikasi identik dalam 5 detik
  if (message === lastToastMessage && now - lastToastAt < 5000) {
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
  } else if (isFirestoreQuotaError(error)) {
    return 'Kuota baca harian gratis Firebase Firestore tercapai — aplikasi beralih otomatis ke cadangan server lokal.';
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
  const friendlyMsg = formatFirestoreErrorMessage(error, options?.customContext);

  if (isFirestoreQuotaError(error)) {
    const firstTransition = markFirestoreQuotaExhausted();
    if (firstTransition) {
      console.warn(
        '[Firestore Quota Notice] Kuota baca harian gratis Firestore tercapai. Mode cadangan server lokal aktif otomatis.',
        { path, operationType }
      );
      if (options?.notify !== false) {
        emitFirebaseErrorToast(friendlyMsg);
      }
    }
    if (options?.throwError === true) {
      throw new Error(JSON.stringify(errInfo));
    }
    return friendlyMsg;
  }

  console.error('Firestore Error:', JSON.stringify(errInfo), error);

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
  if (isFirestoreQuotaExhausted()) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      const firstTransition = markFirestoreQuotaExhausted();
      if (firstTransition) {
        emitFirebaseErrorToast(formatFirestoreErrorMessage(error));
      }
      return false;
    }
    const msg = error instanceof Error ? error.message : String(error || '');
    if (msg.includes('the client is offline') || msg.toLowerCase().includes('unavailable')) {
      console.warn('Koneksi Firebase gagal. Periksa konfigurasi Firebase Anda:', error);
      emitFirebaseErrorToast('Gagal terhubung ke Firebase Firestore. Periksa koneksi internet Anda.');
      return false;
    }
    return true;
  }
}
