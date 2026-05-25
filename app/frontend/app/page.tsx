'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!isSessionReady) return;
    // Handles all cases:
    //   VENDOR → /dashboard, ADMIN → /admin, BUYER → /buyer
    //   unauthenticated (user undefined) → /auth/login
    router.replace(getRoleHomePage(user?.role));
  }, [isSessionReady, user?.role]);

  return <FullPageSpinner />;
}
