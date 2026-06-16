'use client';
import { Box, Button, Flex, Grid, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuPlus, LuShieldAlert } from 'react-icons/lu';
import { TierBadge } from '@/components/shared/tierBadge';
import { useAuthStore } from '@/app/_store/authStore';
import {
  useProducts,
  useProfileCompleteness,
  useGetVerifications,
  useVendorProfile,
} from '@/app/_hooks/vendor';
import { useOrderAnalytics } from '@/app/_hooks/order';
import { ProfileCompletenessBar } from '@/components/dashboard/ProfileCompletenessBar';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { DashboardVerificationStatus } from '@/components/dashboard/DashboardVerificationStatus';
import { DashboardRecentProducts } from '@/components/dashboard/DashboardRecentProducts';
import { StoreLinkStrip } from '@/components/dashboard/StoreLinkStrip';

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: productsPage } = useProducts();
  const products = productsPage?.data ?? [];
  const productCount = productsPage?.total ?? 0;
  const { data: completeness, isLoading: completenessLoading } = useProfileCompleteness();
  const { data: verifications, isLoading: verificationsLoading } = useGetVerifications();
  const { data: profile } = useVendorProfile();
  const { data: analytics } = useOrderAnalytics();

  const inStockCount = products.filter((p) => p.stock_status === 'IN_STOCK').length;
  const firstName = user?.name?.split(' ')[0] || profile?.first_name || 'Vendor';
  const profileSetupPct =
    [
      completeness?.sections.personal_info.completed,
      completeness?.sections.business_info.completed,
    ].filter(Boolean).length * 50;
  const isProfileSetupComplete =
    (completeness?.sections.personal_info.completed ?? false) &&
    (completeness?.sections.business_info.completed ?? false);

  const hasNoActiveVerification = !(verifications ?? []).some(
    (v) => v.status === 'APPROVED' || v.status === 'PENDING'
  );
  const showVerificationBanner =
    isProfileSetupComplete &&
    hasNoActiveVerification &&
    !completenessLoading &&
    !verificationsLoading;

  const verifMap = Object.fromEntries((verifications ?? []).map((v) => [v.type, v]));

  const verificationItems = [
    {
      label: 'Email Verified',
      done: user?.email_verified ?? false,
      status: undefined as string | undefined,
      href: undefined as string | undefined,
    },
    {
      label: 'Personal Info',
      done: completeness?.sections.personal_info.completed ?? false,
      status: undefined,
      href: '/onboarding/personal-info',
    },
    {
      label: 'Business Info',
      done: completeness?.sections.business_info.completed ?? false,
      status: undefined,
      href: '/onboarding/business-info',
    },
    {
      label: 'NIN Verified',
      done: completeness?.sections.nin_verification.completed ?? false,
      status: verifMap['NIN']?.status,
      href:
        verifMap['NIN']?.status === 'REJECTED'
          ? `/verifications/nin/resubmit?id=${verifMap['NIN'].id}`
          : '/verifications/nin',
    },
    {
      label: 'Address Verified',
      done: completeness?.sections.address_verification.completed ?? false,
      status: verifMap['ADDRESS']?.status,
      href:
        verifMap['ADDRESS']?.status === 'REJECTED'
          ? `/verifications/address/resubmit?id=${verifMap['ADDRESS'].id}`
          : '/verifications/address',
    },
    {
      label: 'Business Verified',
      done: completeness?.sections.business_verification.completed ?? false,
      status: verifMap['CAC']?.status ?? verifMap['SMEDAN']?.status,
      href: '/verifications',
    },
  ];

  if (!profile) {
    return (
      <Stack gap={8}>
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
          <Stack gap={1.5}>
            <Box w="220px" h={7} bg="bg.subtle" borderRadius="md" />
            <Box w="160px" h={4} bg="bg.subtle" borderRadius="md" />
          </Stack>
          <Box w="130px" h="40px" bg="bg.subtle" borderRadius="lg" />
        </Flex>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box
              key={i}
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              p={5}
            >
              <Flex justify="space-between" align="flex-start" mb={4}>
                <Box w={10} h={10} borderRadius="lg" bg="bg.subtle" />
                <Box w={3} h={3} bg="bg.subtle" borderRadius="full" />
              </Flex>
              <Box w="60px" h={3} bg="bg.subtle" borderRadius="md" mb={2} />
              <Box w="100px" h={6} bg="bg.subtle" borderRadius="md" mb={1.5} />
              <Box w="80px" h={2.5} bg="bg.subtle" borderRadius="md" />
            </Box>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack gap={8}>
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Flex align="center" gap={3}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Welcome back, {firstName} 👋
            </Heading>
            {profile?.current_tier && <TierBadge tier={profile.current_tier} />}
          </Flex>
          <Text color="fg.muted" textStyle="sm">
            Here is what is happening with your store today.
          </Text>
        </Stack>
        <Button colorPalette="primary" size="md" onClick={() => router.push('/products/new')}>
          <LuPlus />
          Add Product
        </Button>
      </Flex>

      {!isProfileSetupComplete && (
        <Box
          p={5}
          bg="primary.subtle"
          borderWidth="1.5px"
          borderColor="primary.200"
          borderRadius="xl"
        >
          <Flex align="center" gap={4} flexWrap="wrap">
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg="primary.500"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuShieldAlert size={18} color="white" />
            </Flex>
            <Box flex={1} minW="200px">
              <Text fontWeight="semibold" color="primary.fg" textStyle="sm">
                Complete your vendor profile
              </Text>
              <Text color="primary.fg" textStyle="xs" opacity={0.85} mt={0.5}>
                Fill in your personal and business details to make your store visible to buyers.
              </Text>
              <Box mt={2}>
                <ProfileCompletenessBar pct={profileSetupPct} />
              </Box>
            </Box>
            <Button
              colorPalette="primary"
              size="sm"
              flexShrink={0}
              onClick={() => router.push('/onboarding')}
            >
              Complete Setup <LuArrowRight size={14} />
            </Button>
          </Flex>
        </Box>
      )}

      {showVerificationBanner && (
        <Box
          p={5}
          bg="warning.subtle"
          borderWidth="1.5px"
          borderColor="warning.200"
          borderRadius="xl"
        >
          <Flex align="center" gap={4} flexWrap="wrap">
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg="warning.400"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuShieldAlert size={18} color="white" />
            </Flex>
            <Box flex={1} minW="200px">
              <Text fontWeight="semibold" color="warning.fg" textStyle="sm">
                Boost trust and unlock higher tiers
              </Text>
              <Text color="warning.fg" textStyle="xs" opacity={0.85} mt={0.5}>
                Complete identity, address, and business verification to earn a verified badge,
                build buyer confidence, and unlock higher account tiers.
              </Text>
            </Box>
            <Button
              colorPalette="warning"
              size="sm"
              flexShrink={0}
              onClick={() => router.push('/vendor/profile?tab=verifications')}
            >
              Start Verification <LuArrowRight size={14} />
            </Button>
          </Flex>
        </Box>
      )}

      {profile?.business_info_complete && profile?.slug && <StoreLinkStrip slug={profile.slug} />}

      <DashboardStats
        productCount={productCount}
        inStockCount={inStockCount}
        analytics={analytics}
      />

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <DashboardVerificationStatus items={verificationItems} />
        <DashboardQuickActions />
      </Grid>

      <DashboardRecentProducts products={products} productCount={productCount} />
    </Stack>
  );
}
