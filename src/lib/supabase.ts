import { createClient } from '@supabase/supabase-js';

// Default active BibleArena Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://omevbndidzgmnweypjyl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fACp0Xo33kSkrwkHlSMWLQ_YVH3OogK';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Prefer environment variable if set and valid, otherwise fallback to active project credentials
export const supabaseUrl: string =
  envUrl && envUrl.startsWith('https://') && !envUrl.includes('your-project-id')
    ? envUrl
    : DEFAULT_SUPABASE_URL;

export const supabaseAnonKey: string =
  envAnonKey && envAnonKey.length > 20 && !envAnonKey.includes('your-publishable')
    ? envAnonKey
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
