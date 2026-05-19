import { redirect } from 'next/navigation';

/**
 * Root page - redirect to dashboard
 * Uses server-side redirect to avoid client-side redirect loops.
 * Works for both guests and logged-in users.
 */
export default function Home() {
  redirect('/dashboard');
}
