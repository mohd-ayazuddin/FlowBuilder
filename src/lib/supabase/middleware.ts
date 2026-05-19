/**
 * Supabase Middleware - Session Refresh
 *
 * CRITICAL: This middleware does NOT do auth-based redirects.
 * It ONLY refreshes the Supabase session cookie when available.
 *
 * All routes are accessible to both guests and logged-in users.
 * Auth redirects are handled at the component level, not middleware.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE' ||
    supabaseAnonKey.includes('_HERE') ||
    supabaseAnonKey.includes('your-') ||
    supabaseAnonKey.includes('YOUR_') ||
    !supabaseUrl.startsWith('http')
  ) {
    // Supabase not configured - just pass through, no auth checks
    // Do NOT redirect here - let the app handle routing at the component level
    return supabaseResponse;
  }

  // Supabase is configured - create server client for session refresh only
  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Only refresh the session - do NOT redirect based on auth state
    // This prevents redirect loops
    await supabase.auth.getUser();
  } catch {
    // Session refresh failed - continue as guest
    // Do NOT redirect
  }

  return supabaseResponse;
}
