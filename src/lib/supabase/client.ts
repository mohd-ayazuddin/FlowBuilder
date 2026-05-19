/**
 * Supabase Browser Client
 * Gracefully handles missing/invalid environment variables.
 * Returns a safe no-op client when Supabase is not configured.
 */

import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    key &&
    !url.includes('your-') &&
    !key.includes('your-') &&
    !key.includes('YOUR_') &&
    !key.includes('_HERE') &&
    url.startsWith('http')
  );
}

// Cache the client instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    // Return a mock client that won't crash but returns empty data
    // This prevents the app from crashing when Supabase is not configured
    if (!clientInstance) {
      clientInstance = createNoOpClient();
    }
    return clientInstance;
  }

  try {
    if (!clientInstance) {
      clientInstance = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return clientInstance;
  } catch {
    // If client creation fails, return no-op client
    if (!clientInstance) {
      clientInstance = createNoOpClient();
    }
    return clientInstance;
  }
}

/**
 * Creates a no-op Supabase client that safely returns empty data
 * when Supabase is not configured. This prevents crashes and redirect loops.
 */
function createNoOpClient(): any {
  const emptyPromise = <T = null>(value: T = null as T) => Promise.resolve({ data: { user: null, session: null }, error: null });

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Authentication not configured' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Authentication not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: { message: 'Authentication not configured' } }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Authentication not configured' } }),
      exchangeCodeForSession: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Authentication not configured' } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  };
}

export { isSupabaseConfigured };
