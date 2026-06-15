'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminProfile } from '@/app/_hooks/admin';
import { Box, Text } from '@chakra-ui/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading } = useAdminProfile();

  const isOnboarding = pathname === '/admin/onboarding';

  useEffect(() => {
    if (isLoading) return;

    if (isOnboarding) {
      if (profile && profile.profile_complete) {
        router.replace('/admin');
      }
    } else {
      if (profile === null || (profile && !profile.profile_complete)) {
        router.replace('/admin/onboarding');
      }
    }
  }, [isLoading, profile, isOnboarding, router]);

  if (isLoading) {
    return (
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
    );
  }

  if (isOnboarding) {
    if (profile && profile.profile_complete) return null;
    return <>{children}</>;
  }

  if (profile === null || (profile && !profile.profile_complete)) return null;

  return <>{children}</>;
}
