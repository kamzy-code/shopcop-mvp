'use client';
import { use } from 'react';
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { useAdminUser } from '@/app/_hooks/admin';
import { UserInfoCard } from '@/components/admin/UserInfoCard';
import { BuyerProfileCard } from '@/components/admin/BuyerProfileCard';
import { VendorTabs } from '@/components/admin/VendorTabs';
import { AdminActionsPanel } from '@/components/admin/AdminActionsPanel';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: user, isLoading } = useAdminUser(id);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" color="primary.500" />
      </Flex>
    );
  }

  if (!user) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="fg.muted">User not found.</Text>
      </Box>
    );
  }

  return (
    <Stack gap={8}>
      <Button
        variant="ghost"
        size="sm"
        color="fg.muted"
        w="fit-content"
        px={0}
        onClick={() => router.push('/admin/users')}
      >
        <LuArrowLeft size={14} /> Back to Users
      </Button>

      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
            {user.name || user.email}
          </Heading>
          <Flex align="center" gap={2}>
            <Box px={2} py={0.5} borderRadius="md" bg="bg.subtle" borderWidth="1px" borderColor="border">
              <Text textStyle="xs" fontWeight="medium" color="fg">{user.role}</Text>
            </Box>
            <Box px={2} py={0.5} borderRadius="full" bg={user.is_active ? 'success.subtle' : 'red.subtle'}>
              <Text textStyle="xs" fontWeight="semibold" color={user.is_active ? 'success.fg' : 'red.600'}>
                {user.is_active ? 'Active' : 'Banned'}
              </Text>
            </Box>
          </Flex>
        </Stack>
      </Flex>

      <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
        <Stack gap={4} flex={1}>
          <UserInfoCard user={user} />
          {user.buyer_profile && <BuyerProfileCard buyerProfile={user.buyer_profile} />}
          {user.vendor_profile && <VendorTabs vendorProfile={user.vendor_profile} />}
        </Stack>

        <Box w={{ base: 'full', md: '300px' }} flexShrink={0}>
          <AdminActionsPanel user={user} />
        </Box>
      </Flex>
    </Stack>
  );
}
