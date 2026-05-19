'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
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

  useEffect(() => {
    let mounted = true;

    // SAFETY NET: If auth takes more than 5 seconds, force guest mode
    // This prevents infinite loading screens if Supabase is unreachable
    const authTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[FlowBuilder] Auth initialization timed out - entering guest mode');
        setIsGuest(true);
        setUser(null);
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      // Check if user previously chose guest mode
      const guestMode = typeof window !== 'undefined' ? localStorage.getItem(GUEST_MODE_KEY) : null;

      if (!isSupabaseConfigured()) {
        // Supabase not configured - always guest mode, never block rendering
        clearTimeout(authTimeout);
        if (mounted) {
          setIsGuest(true);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();

        // Get initial session with a timeout
        const userResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<{ data: { user: null }; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: { user: null }, error: null }), 4000)
          ),
        ]);

        if (!mounted) {
          clearTimeout(authTimeout);
          return;
        }

        const currentUser = userResult.data?.user;

        if (currentUser) {
          // User is logged in
          setUser(currentUser);
          setIsGuest(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(GUEST_MODE_KEY);
          }
        } else if (guestMode === 'true') {
          // User previously chose guest mode
          setIsGuest(true);
          setUser(null);
        } else {
          // No user and no explicit guest mode choice
          // Auto-enter guest mode for frictionless experience (like Figma/Miro)
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
            if (typeof window !== 'undefined') {
              localStorage.removeItem(GUEST_MODE_KEY);
            }
          }
          setLoading(false);
        });
        subscriptionRef.current = data.subscription;
      } catch {
        // Supabase error - enter guest mode silently
        if (mounted) {
          setIsGuest(true);
          setUser(null);
        }
      }

      clearTimeout(authTimeout);
      if (mounted) setLoading(false);
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch {
          // silent
        }
      }
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Using guest mode.' };
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
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Authentication is not configured. Using guest mode.' };
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
  }, []);

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
    }
    router.push('/dashboard');
  }, [router]);

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
  }, []);

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
  }, []);

  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
    }
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_MODE_KEY);
    }
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
