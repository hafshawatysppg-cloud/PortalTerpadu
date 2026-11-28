import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const rawSupabaseUrl = normalizeSupabaseUrl(
  process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://eqncmbbcewrgbhzzfwiv.supabase.co'
);

const supabaseUrl =
  rawSupabaseUrl && !rawSupabaseUrl.includes('placeholder')
    ? rawSupabaseUrl
    : 'https://eqncmbbcewrgbhzzfwiv.supabase.co';

const rawSupabaseKey = (
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

const isKeyValid = Boolean(
  rawSupabaseKey &&
    !rawSupabaseKey.includes('placeholder') &&
    !rawSupabaseKey.includes('your-')
);

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let supabase = null;

if (!isKeyValid) {
  console.warn('Supabase API key belum dikonfigurasi');
} else {
  try {
    supabase = createClient(supabaseUrl, rawSupabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch (err) {
    console.warn('Connection error:', err?.message || String(err));
    supabase = null;
  }
}

function isNetworkUnreachable(err) {
  const msg = String(err?.message || err || '').toLowerCase();
  const details = String(err?.details || '').toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('abort') ||
    details.includes('fetch failed') ||
    details.includes('enotfound')
  );
}

export async function testDbConnection() {
  if (!supabase) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .abortSignal(controller.signal);
    if (error) {
      if (isNetworkUnreachable(error)) {
        console.log('ℹ️ Supabase direct probe offline/unreachable; using local snapshot cache.');
      } else {
        console.warn('Connection notice:', error.message || String(error));
      }
    } else {
      console.log('Connected:', data);
    }
    return { data, error };
  } catch (err) {
    if (isNetworkUnreachable(err)) {
      console.log('ℹ️ Supabase direct probe offline/unreachable; using local snapshot cache.');
    } else {
      console.warn('Connection notice:', err?.message || String(err));
    }
    return { data: null, error: err };
  } finally {
    clearTimeout(timer);
  }
}

if (supabase) {
  void testDbConnection();
}

export default supabase;
