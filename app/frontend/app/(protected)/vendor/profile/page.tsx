'use client';
import { Box, Flex, Heading, Stack, Tabs, Text } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuBuilding2, LuShieldCheck, LuUser } from 'react-icons/lu';
import { useVendorProfile } from '@/app/_hooks/vendor';
import { AppShell } from '@/components/shared/appShell';
import { TierBadge } from '@/components/shared/tierBadge';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { PersonalInfoTab } from '@/components/vendor/PersonalInfoTab';
import { BusinessInfoTab } from '@/components/vendor/BusinessInfoTab';
import { VerificationsTab } from '@/components/vendor/VerificationsTab';

export default function VendorProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'personal-info';
  const { data: profile, isLoading } = useVendorProfile();

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : (profile?.first_name?.[0] ?? 'V').toUpperCase();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Vendor';

  if (isLoading) return <AppShell><FullPageSpinner /></AppShell>;

  return (
    <AppShell>
      <Stack gap={6}>
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" position="relative">
          <Box position="absolute" top={4} right={4}>
            <TierBadge tier={profile?.current_tier ?? 'TIER_0'} size="md" />
          </Box>
          <Flex direction={{ base: 'column', sm: 'row' }} align="center" gap={{ base: 3, sm: 4 }}>
            <Flex w={14} h={14} borderRadius="full" bg="primary.subtle" align="center" justify="center" flexShrink={0}>
              <Text fontWeight="bold" textStyle="xl" color="primary.fg">{initials}</Text>
            </Flex>
            <Box flex={1} minW={0} textAlign={{ base: 'center', sm: 'left' }}>
              <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">{fullName}</Heading>
              <Text textStyle="sm" color="fg.muted" mt={0.5}>{profile?.user?.email}</Text>
              <Flex align="center" gap={1.5} mt={2} justify={{ base: 'center', sm: 'flex-start' }}>
                <Text textStyle="sm" fontWeight="bold" color="fg">{profile?.profile_completeness ?? 0}%</Text>
                <Text textStyle="xs" color="fg.muted">profile complete</Text>
              </Flex>
            </Box>
          </Flex>
        </Box>

        <Tabs.Root
          value={activeTab}
          onValueChange={({ value }) => router.push(`/vendor/profile?tab=${value}`)}
        >
          <Tabs.List gap={{ base: 3, sm: 0 }}>
            <Tabs.Trigger value="personal-info">
              <LuUser size={20} />
              <Box hideBelow="sm">Personal Info</Box>
            </Tabs.Trigger>
            <Tabs.Trigger value="business-info">
              <LuBuilding2 size={20} />
              <Box hideBelow="sm">Business Info</Box>
            </Tabs.Trigger>
            <Tabs.Trigger value="verifications">
              <LuShieldCheck size={20} />
              <Box hideBelow="sm">Verifications</Box>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt={6}>
            <Tabs.Content value="personal-info"><PersonalInfoTab /></Tabs.Content>
            <Tabs.Content value="business-info"><BusinessInfoTab /></Tabs.Content>
            <Tabs.Content value="verifications"><VerificationsTab /></Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
    </AppShell>
  );
}
