'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const subscriptionRef = useRef<any>(null);

  // Check if Supabase is properly configured
  const isSupabaseConfigured = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return (
      url &&
      key &&
      !url.includes('your-') &&
      !key.includes('your-') &&
      !key.includes('YOUR_') &&
      !key.includes('_HERE') &&
      url.startsWith('http')
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Check if user previously chose guest mode
      const guestMode = localStorage.getItem(GUEST_MODE_KEY);

      if (!isSupabaseConfigured()) {
        // Supabase not configured - always guest mode
        if (mounted) {
          setIsGuest(true);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();

        // Get initial session
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!mounted) return;

        if (currentUser) {
          // User is logged in
          setUser(currentUser);
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        } else if (guestMode === 'true') {
          // User previously chose guest mode
          setIsGuest(true);
          setUser(null);
        } else {
          // No user and no explicit guest mode choice
          // Auto-enter guest mode for frictionless experience
          setIsGuest(true);
          setUser(null);
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          const authUser = session?.user ?? null;
          setUser(authUser);
          if (authUser) {
            setIsGuest(false);
            localStorage.removeItem(GUEST_MODE_KEY);
          }
          setLoading(false);
        });
        subscriptionRef.current = data.subscription;
      } catch {
        // Supabase error - guest mode
        if (mounted) {
          setIsGuest(true);
          setUser(null);
        }
      }

      if (mounted) setLoading(false);
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [isSupabaseConfigured]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Please try again later.' };
    }
    try {
      const supabase = createClient();
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
  }, [isSupabaseConfigured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Please try again later.' };
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  }, [isSupabaseConfigured]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // silent
      }
    }
    setUser(null);
    // Go back to guest mode after sign out
    setIsGuest(true);
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    router.push('/dashboard');
  }, [isSupabaseConfigured, router]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured.' };
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Reset failed' };
    }
  }, [isSupabaseConfigured]);

  const updatePassword = useCallback(async (password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured.' };
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Update failed' };
    }
  }, [isSupabaseConfigured]);

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
