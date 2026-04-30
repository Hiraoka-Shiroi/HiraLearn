/**
 * Supabase client singleton.
 *
 * Key design decisions:
 * - `persistSession: true` — keeps the JWT in storage so the user stays
 *   logged in across page reloads.
 * - `detectSessionInUrl` — set to `false` inside Capacitor (APK / file://
 *   protocol) because the OAuth redirect URL doesn't contain a valid hash
 *   fragment; leaving it `true` would cause auth to silently fail.
 * - `customStorage` — a memory-backed fallback is used when `localStorage`
 *   is blocked (e.g. in some WebView / file:// environments on Android).
 *   This keeps the app functional even without persistent storage.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage: Record<string, string> = {};
const customStorage = isLocalStorageAvailable()
  ? window.localStorage
  : {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    };

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const isCapacitor = typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' || navigator.userAgent.includes('HiraLearn'));

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: !isCapacitor,
    }
  }
);

if (!isSupabaseConfigured) {
  console.warn('HiraLearn Warning: Supabase credentials missing. App will run in demo mode.');
}
