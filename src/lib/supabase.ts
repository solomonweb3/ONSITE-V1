import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Expo inlines EXPO_PUBLIC_* env vars at build time (from .env.local).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear message rather than a cryptic crash deep in a query.
  console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — check .env.local');
}

// Single shared client for the whole app.
// AsyncStorage persists the auth session across app restarts (RN has no cookies).
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web returns the OAuth code in the URL and Supabase auto-exchanges it;
    // native completes the exchange manually after the deep-link redirect.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
