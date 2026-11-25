import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const rawSupabaseUrl = normalizeSupabaseUrl(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
);
const rawServiceOrAnonKey = (
  process.env.SUPABASE_API_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

function isValidHttpUrl(value: string): boolean {
  if (!value || value.includes('placeholder') || value.includes('your-project')) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isServerSupabaseConfigured = Boolean(
  isValidHttpUrl(rawSupabaseUrl) &&
    rawServiceOrAnonKey &&
    !rawServiceOrAnonKey.includes('placeholder') &&
    !rawServiceOrAnonKey.includes('your-')
);

export const hasServerServiceRoleKey = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
);

let serverSupabaseClient: SupabaseClient | null = null;

export function getServerSupabaseClient(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  if (!serverSupabaseClient) {
    serverSupabaseClient = createClient(rawSupabaseUrl, rawServiceOrAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'portal-layanan-terpadu-server',
        },
      },
    });
  }
  return serverSupabaseClient;
}

export function getServerSupabaseMetadata() {
  let host = 'belum-dikonfigurasi';
  if (isValidHttpUrl(rawSupabaseUrl)) {
    try {
      host = new URL(rawSupabaseUrl).hostname;
    } catch {
      host = rawSupabaseUrl;
    }
  }
  return {
    urlConfigured: isValidHttpUrl(rawSupabaseUrl),
    keyConfigured: Boolean(rawServiceOrAnonKey),
    serviceRoleConfigured: hasServerServiceRoleKey,
    projectHost: host,
    projectRef: host.includes('.') ? host.split('.')[0] : host,
  };
}

export async function verifySupabaseAccessToken(token: string) {
  const client = getServerSupabaseClient();
  if (!client || !token) return null;
  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}
