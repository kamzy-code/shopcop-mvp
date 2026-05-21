'use client';
import { useAuthStore } from '@/app/_store/authStore';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const router = useRouter();

  useEffect(() => {
    if (isSessionReady && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, isSessionReady]);
  if (!isSessionReady) return <FullPageSpinner />;
  if (isAuthenticated) return null;
  return <>{children}</>;
}
