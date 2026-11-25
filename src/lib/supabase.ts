import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const rawSupabaseUrl = normalizeSupabaseUrl(String(import.meta.env.VITE_SUPABASE_URL ?? ''));
const rawSupabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

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
