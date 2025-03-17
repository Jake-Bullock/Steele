import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Read environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Check if we're in a browser environment with localStorage available
const isBrowser = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

// Create a custom storage adapter for Supabase Auth
const LiteSecureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (isBrowser()) {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null); // SSR - return null
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (isBrowser()) {
        window.localStorage.setItem(key, value);
      }
      return Promise.resolve(); // SSR - just resolve
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (isBrowser()) {
        window.localStorage.removeItem(key);
      }
      return Promise.resolve(); // SSR - just resolve
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  },
};

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LiteSecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;