'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      // If Supabase is not configured, redirect to dashboard as guest
      if (!isSupabaseConfigured()) {
        router.replace('/dashboard');
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          console.error('Auth callback error:', error.message);
          router.replace('/dashboard');
          return;
        }

        router.replace('/dashboard');
      } catch {
        // Any error - fall back to dashboard
        router.replace('/dashboard');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Completing sign in...</span>
      </div>
    </div>
  );
}
