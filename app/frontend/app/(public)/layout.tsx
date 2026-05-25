'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (isSessionReady && isAuthenticated) router.push(getRoleHomePage(user?.role));
  }, [isAuthenticated, isSessionReady, user?.role]);
  if (!isSessionReady) return <FullPageSpinner />;
  if (isAuthenticated) return null;
  return <>{children}</>;
}
