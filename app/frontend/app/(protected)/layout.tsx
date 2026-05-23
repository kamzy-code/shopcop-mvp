'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { UserRole } from '@/app/_types';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { ErrorBoundary } from '@/components/shared/errorBoundary';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProfileCompleteness } from '@/app/_hooks/vendor';

const ROLE_REQUIREMENTS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/onboarding', roles: ['VENDOR'] },
  { prefix: '/dashboard', roles: ['VENDOR'] },
  { prefix: '/products', roles: ['VENDOR'] },
  { prefix: '/verifications', roles: ['VENDOR'] },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const { data: completeness } = useProfileCompleteness();

  useEffect(() => {
    if (!isSessionReady) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    const requirement = ROLE_REQUIREMENTS.find((r) => pathname.startsWith(r.prefix));
    if (requirement && user && !requirement.roles.includes(user.role)) {
      router.push('/');
    }
  }, [isAuthenticated, isSessionReady, pathname, user]);

  if (!isSessionReady) return <FullPageSpinner />;
  if (!isAuthenticated) return null;

  const requirement = ROLE_REQUIREMENTS.find((r) => pathname.startsWith(r.prefix));
  if (requirement && user && !requirement.roles.includes(user.role)) return null;

  // For non-onboarding routes: wait for completeness, then redirect if profile not started
  const isOnboarding = pathname.startsWith('/onboarding');
  if (!isOnboarding) {
    if (!completeness) return <FullPageSpinner />;
    if (!completeness.sections.personal_info.completed) {
      router.replace('/onboarding');
      return null;
    }
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
