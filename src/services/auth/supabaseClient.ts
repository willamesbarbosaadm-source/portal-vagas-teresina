import { createClient, SupabaseClient } from '@supabase/supabase-js';

const REAL_SUPABASE_CONFIG = {
  url: 'https://devkpsjwgvefikxbdsry.supabase.co',
  anonKey: 'sb_publishable_LsczW5EBxyg99ChAsnsegw_QeLhEt0d'
};

const isPlaceholder = (val?: string) =>
  !val ||
  ['', 'undefined', 'null', 'your_supabase_url', 'your_supabase_anon_key', '1sdcfds'].includes(
    val.trim().toLowerCase()
  ) ||
  !val.trim().startsWith('http');

const isKeyPlaceholder = (val?: string) =>
  !val ||
  ['', 'undefined', 'null', 'your_supabase_anon_key', 'placeholder-anon-key'].includes(
    val.trim().toLowerCase()
  ) ||
  val.trim().length < 10;

const rawUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const rawAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const supabaseUrl = !isPlaceholder(rawUrl)
  ? rawUrl!.trim()
  : REAL_SUPABASE_CONFIG.url;

export const supabaseAnonKey = !isKeyPlaceholder(rawAnonKey)
  ? rawAnonKey!.trim()
  : REAL_SUPABASE_CONFIG.anonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

