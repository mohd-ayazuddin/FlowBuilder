'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Always go to dashboard - both guests and logged-in users
      router.replace('/dashboard');
    }
  }, [user, loading, isGuest, router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <span className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    </div>
  );
}
