/**
 * Supabase Server Client
 * Gracefully handles missing/invalid environment variables.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    // Return a no-op client that won't crash
    return createNoOpServerClient();
  }

  try {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
  } catch {
    // If cookie access fails (e.g., in static generation), return no-op client
    return createNoOpServerClient();
  }
}

/**
 * No-op server client for when Supabase is not configured
 */
function createNoOpServerClient(): any {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
  };
}
