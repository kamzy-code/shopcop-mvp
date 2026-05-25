'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { UserRole } from '@/app/_types';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { ErrorBoundary } from '@/components/shared/errorBoundary';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProfileCompleteness } from '@/app/_hooks/vendor';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';

const ROLE_REQUIREMENTS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/onboarding', roles: ['VENDOR'] },
  { prefix: '/dashboard', roles: ['VENDOR'] },
  { prefix: '/products', roles: ['VENDOR'] },
  { prefix: '/verifications', roles: ['VENDOR'] },
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/buyer', roles: ['BUYER'] },
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
      // Redirect to the user's own home instead of '/' to prevent potential loops
      router.push(getRoleHomePage(user.role));
      return;
    }
    // Redirect to onboarding if personal info is not yet completed (vendor routes only)
    const isOnboarding = pathname.startsWith('/onboarding');
    const isAdmin = pathname.startsWith('/admin');
    const isBuyer = pathname.startsWith('/buyer');
    if (!isOnboarding && !isAdmin && !isBuyer && completeness && !completeness.sections.personal_info.completed) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isSessionReady, pathname, user, completeness]);

  if (!isSessionReady) return <FullPageSpinner />;
  if (!isAuthenticated) return null;

  const requirement = ROLE_REQUIREMENTS.find((r) => pathname.startsWith(r.prefix));
  if (requirement && user && !requirement.roles.includes(user.role)) return null;

  // Admin and buyer routes skip the vendor completeness guard entirely
  const isOnboarding = pathname.startsWith('/onboarding');
  const isAdmin = pathname.startsWith('/admin');
  const isBuyer = pathname.startsWith('/buyer');
  if (!isOnboarding && !isAdmin && !isBuyer && !completeness) return <FullPageSpinner />;

  // Prevent flash of protected content while the useEffect redirect fires
  if (!isOnboarding && !isAdmin && !isBuyer && completeness && !completeness.sections.personal_info.completed) return null;

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
