'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_MODE_KEY = 'flowbuilder_guest_mode';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user previously chose guest mode
    const guestMode = localStorage.getItem(GUEST_MODE_KEY);
    setIsGuest(guestMode === 'true');

    // Get initial session
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          // User is logged in, turn off guest mode
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        }
      } catch {
        // Supabase not configured, allow guest mode
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        }
        setLoading(false);
      });
      subscription = data.subscription;
    } catch {
      setLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, full_name: name },
        },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // silent
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem(GUEST_MODE_KEY);
    router.push('/login');
  }, [supabase.auth, router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Reset failed' };
    }
  }, [supabase.auth]);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Update failed' };
    }
  }, [supabase.auth]);

  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem(GUEST_MODE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        enterGuestMode,
        exitGuestMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
