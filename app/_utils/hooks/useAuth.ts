import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useRouter } from 'expo-router';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // Store the authenticated user
  const router = useRouter();

  useEffect(() => {
    // Fetch the current session on mount
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
    };

    fetchUser();

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Clear the user on sign out
    } catch (error: any) {
      throw error;
    }
  };

  return {
    user, // Expose the user object
    signOut,
    loading,
  };
}

export default useAuth;