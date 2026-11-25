import { isSupabaseConfigured, testSupabaseConnection } from './supabase';

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

type CloudErrorListener = (message: string) => void;
const errorListeners = new Set<CloudErrorListener>();
let lastToastMessage = '';
let lastToastAt = 0;

export const FIRESTORE_UPGRADE_URL = 'https://supabase.com/dashboard';

export function isFirestoreQuotaError(_error: unknown): boolean {
  return false;
}

export function isFirestoreQuotaExhausted(): boolean {
  return false;
}

export function markFirestoreQuotaExhausted(): boolean {
  return false;
}

export function resetFirestoreQuotaState(): void {
  // No-op: Supabase PostgreSQL does not impose Firebase free daily read quota lockouts
}

export function subscribeFirebaseErrorToast(listener: CloudErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function emitFirebaseErrorToast(message: string): void {
  const now = Date.now();
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

  let reason = 'Gagal terhubung ke layanan database Supabase.';
  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('42501')) {
    reason = 'Akses ke tabel Supabase ditolak oleh kebijakan Row Level Security (RLS).';
  } else if (lower.includes('jwt') || lower.includes('unauthorized') || lower.includes('401')) {
    reason = 'Sesi autentikasi Supabase belum valid atau kedaluwarsa.';
  } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('unavailable')) {
    reason = 'Koneksi internet atau layanan Supabase sedang tidak tersedia.';
  } else if (lower.includes('relation') && lower.includes('does not exist')) {
    reason = 'Tabel Supabase belum dibuat. Jalankan skema supabase_schema.sql terlebih dahulu.';
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
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
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

  if (options?.throwError !== false) {
    console.error('Supabase Data Error:', JSON.stringify(errInfo), error);
  } else {
    console.warn('Supabase Data Notice:', JSON.stringify(errInfo));
  }

  if (options?.notify !== false && isSupabaseConfigured) {
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
  const result = await testSupabaseConnection();
  if (result.configured && !result.connected) {
    console.warn('Koneksi Supabase notice:', result.message);
  }
  return result.connected;
}
