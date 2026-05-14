'use client';
import { useAuthStore } from '@/app/_store/authStore';
import FullPageSpinner from '@/components/fullPageSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading]);
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
