import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnvVar(key: string): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> })?.env;
    if (metaEnv && typeof metaEnv[key] === 'string' && metaEnv[key]) {
      return String(metaEnv[key]).trim();
    }
  } catch {
    // Ignore when running outside Vite ESM
  }

  try {
    if (typeof process !== 'undefined' && process.env && typeof process.env[key] === 'string') {
      return String(process.env[key]).trim();
    }
  } catch {
    // Ignore
  }

  return '';
}

const rawSupabaseUrl = readEnvVar('VITE_SUPABASE_URL') || readEnvVar('SUPABASE_URL');
const rawSupabaseAnonKey = readEnvVar('VITE_SUPABASE_ANON_KEY') || readEnvVar('SUPABASE_ANON_KEY');

const FALLBACK_SUPABASE_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    isValidHttpUrl(rawSupabaseUrl) &&
    !rawSupabaseUrl.includes('placeholder') &&
    !rawSupabaseAnonKey.includes('placeholder')
);

export const supabaseUrl: string = isValidHttpUrl(rawSupabaseUrl)
  ? rawSupabaseUrl
  : FALLBACK_SUPABASE_URL;

export const supabaseAnonKey: string = rawSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export function getSupabaseClient(): SupabaseClient | null {
  return isSupabaseConfigured ? supabase : null;
}

export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      message: 'Konfigurasi VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi; berjalan dengan cache server lokal.'
    };
  }

  try {
    const { error } = await supabase.from('app_state_sync').select('key').limit(1);
    if (error) {
      return {
        configured: true,
        connected: false,
        message: error.message || 'Gagal menghubungi tabel Supabase.'
      };
    }
    return {
      configured: true,
      connected: true,
      message: 'Koneksi ke Supabase aktif dan siap digunakan.'
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: err?.message || 'Gagal menguji koneksi Supabase.'
    };
  }
}

export default supabase;
