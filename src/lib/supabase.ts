import { createClient } from '@supabase/supabase-js';

// Default active BibleArena Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://omevbndidzgmnweypjyl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fACp0Xo33kSkrwkHlSMWLQ_YVH3OogK';

// Sanitize strings to strip any invisible Unicode BOM (e.g. \uFEFF) or non-ISO-8859-1 characters
function sanitize(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val.replace(/[^\x20-\x7E]/g, '').trim();
}

const rawUrl = sanitize(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const rawAnonKey = sanitize(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

// Prefer environment variable if set and valid, otherwise fallback to active project credentials
export const supabaseUrl: string =
  rawUrl && rawUrl.startsWith('https://') && !rawUrl.includes('your-project-id')
    ? rawUrl
    : DEFAULT_SUPABASE_URL;

export const supabaseAnonKey: string =
  rawAnonKey && rawAnonKey.length > 20 && !rawAnonKey.includes('your-publishable')
    ? rawAnonKey
    : DEFAULT_SUPABASE_ANON_KEY;

// Validate that the Supabase configuration is present and is not a placeholder
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
