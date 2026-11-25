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

export async function testDbConnection() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.warn('Connection error:', error.message || String(error));
    } else {
      console.log('Connected:', data);
    }
    return { data, error };
  } catch (err) {
    console.warn('Connection error:', err?.message || String(err));
    return { data: null, error: err };
  }
}

if (supabase) {
  void testDbConnection();
}

export default supabase;
