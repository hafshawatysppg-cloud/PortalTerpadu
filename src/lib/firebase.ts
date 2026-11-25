import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export const auth = getSupabaseClient()?.auth ?? null;
export const db = null;
export const getDb = () => null;
export const getSupabase = getSupabaseClient;
export { isSupabaseConfigured };
export default getSupabaseClient;
