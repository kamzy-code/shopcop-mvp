'use client';
import { useAuthStore } from '@/app/_store/authStore';
import { UserRole } from '@/app/_types';
import { Box, Text } from '@chakra-ui/react';
import { ErrorBoundary } from '@/components/shared/errorBoundary';
import { AppShell } from '@/components/shared/appShell';
import { AdminShell } from '@/components/shared/adminShell';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProfileCompleteness } from '@/app/_hooks/vendor';
import { getRoleHomePage } from '@/app/_lib/roleRedirect';

const ROLE_REQUIREMENTS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/onboarding', roles: ['VENDOR'] },
  { prefix: '/dashboard', roles: ['VENDOR'] },
  { prefix: '/products', roles: ['VENDOR'] },
  { prefix: '/orders', roles: ['VENDOR'] },
  { prefix: '/verifications', roles: ['VENDOR'] },
  { prefix: '/reviews', roles: ['VENDOR'] },
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

  if (!isSessionReady) {
    return (
      <Box minH="100dvh" bg="bg" />
    );
  }
  if (!isAuthenticated) return null;

  const requirement = ROLE_REQUIREMENTS.find((r) => pathname.startsWith(r.prefix));
  if (requirement && user && !requirement.roles.includes(user.role)) return null;

  const isOnboarding = pathname.startsWith('/onboarding');
  const isAdmin = pathname.startsWith('/admin');
  const isBuyer = pathname.startsWith('/buyer');
  const isVerifications = pathname.startsWith('/verifications');

  const vendorShell = (
    <AppShell>
      <Box textAlign="center" py={16}>
        <Box
          mx="auto"
          w={{ base: 10, sm: 12, md: 16 }}
          h={{ base: 10, sm: 12, md: 16 }}
          borderRadius="full"
          borderWidth="3px"
          borderColor="primary.500"
          borderTopColor="transparent"
          animation="spin 0.8s linear infinite"
          mb={4}
        />
        <Text color="fg.muted" textStyle={{ base: 'sm', sm: 'md' }}>
          Loading...
        </Text>
      </Box>
    </AppShell>
  );

  // Admin and buyer routes skip the vendor completeness guard entirely
  if (!isOnboarding && !isAdmin && !isBuyer && !completeness) return vendorShell;

  // Prevent flash of protected content while the useEffect redirect fires
  if (!isOnboarding && !isAdmin && !isBuyer && completeness && !completeness.sections.personal_info.completed) return null;

  // Wrap in appropriate shell based on route
  if (isAdmin) return <ErrorBoundary><AdminShell>{children}</AdminShell></ErrorBoundary>;
  if (isOnboarding || isBuyer || isVerifications) return <ErrorBoundary>{children}</ErrorBoundary>;
  return <ErrorBoundary><AppShell>{children}</AppShell></ErrorBoundary>;
}
