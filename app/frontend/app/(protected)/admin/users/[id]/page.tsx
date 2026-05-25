'use client';
import { useState } from 'react';
import { use } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import {
  useAdminUser,
  useAdminUpdateUserStatus,
  useAdminUpdateUserRole,
} from '@/app/_hooks/admin';
import { toaster } from '@/components/ui/toaster';
import { MutationErrorAlert } from '@/components/shared/mutationErrorAlert';

function InfoRow({ label, value }: { label: string; value?: string | null | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <Flex gap={3}>
      <Text textStyle="sm" color="fg.muted" w="44" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color="fg" fontWeight="medium">
        {display}
      </Text>
    </Flex>
  );
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: user, isLoading } = useAdminUser(id);
  const statusMutation = useAdminUpdateUserStatus();
  const roleMutation = useAdminUpdateUserRole();

  const [selectedRole, setSelectedRole] = useState<string>('');

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

  const handleToggleStatus = async () => {
    const newStatus = !user.is_active;
    try {
      await statusMutation.mutateAsync({ id, is_active: newStatus });
      toaster.create({
        title: newStatus ? 'User Activated' : 'User Banned',
        description: `User account has been ${newStatus ? 'activated' : 'deactivated'}.`,
        type: newStatus ? 'success' : 'info',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status.';
      toaster.create({ title: 'Error', description: message, type: 'error' });
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user.role) return;
    try {
      await roleMutation.mutateAsync({ id, role: selectedRole as 'VENDOR' | 'BUYER' | 'ADMIN' });
      toaster.create({
        title: 'Role Updated',
        description: `User role changed to ${selectedRole}.`,
        type: 'success',
      });
      setSelectedRole('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role.';
      toaster.create({ title: 'Error', description: message, type: 'error' });
    }
  };

  const vendorProfile = (user as any).vendor_profile;

  return (
    <Stack gap={8}>
      {/* Back button */}
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

      {/* Header */}
      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
            {user.name || user.email}
          </Heading>
          <Flex align="center" gap={2}>
            <Box px={2} py={0.5} borderRadius="md" bg="bg.subtle" borderWidth="1px" borderColor="border">
              <Text textStyle="xs" fontWeight="medium" color="fg">
                {user.role}
              </Text>
            </Box>
            <Box
              px={2}
              py={0.5}
              borderRadius="full"
              bg={user.is_active ? 'success.subtle' : 'red.subtle'}
            >
              <Text textStyle="xs" fontWeight="semibold" color={user.is_active ? 'success.fg' : 'red.600'}>
                {user.is_active ? 'Active' : 'Banned'}
              </Text>
            </Box>
          </Flex>
        </Stack>
      </Flex>

      <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
        {/* Left — User details */}
        <Stack gap={4} flex={1}>
          {/* User info */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              User Information
            </Text>
            <Stack gap={3}>
              <InfoRow label="User ID" value={user.id} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Name" value={user.name} />
              <InfoRow label="Role" value={user.role} />
              <InfoRow label="Email Verified" value={user.email_verified} />
              <InfoRow label="Active" value={user.is_active} />
              <InfoRow label="Joined" value={new Date(user.created_at).toLocaleString('en-NG')} />
              <InfoRow
                label="Last Login"
                value={user.last_login_at ? new Date(user.last_login_at).toLocaleString('en-NG') : 'Never'}
              />
            </Stack>
          </Box>

          {/* Vendor profile (if any) */}
          {vendorProfile && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Vendor Profile
              </Text>
              <Stack gap={3}>
                <InfoRow label="Vendor Profile ID" value={vendorProfile.id} />
                <InfoRow label="Business Name" value={vendorProfile.business_name} />
                <InfoRow label="Current Tier" value={vendorProfile.current_tier} />
                <InfoRow label="Verification Points" value={vendorProfile.verification_points} />
                <InfoRow label="Profile Completeness" value={`${vendorProfile.profile_completeness}%`} />
                <InfoRow label="Personal Info Complete" value={vendorProfile.personal_info_complete} />
                <InfoRow label="Business Info Complete" value={vendorProfile.business_info_complete} />
                <InfoRow label="Profile Status" value={vendorProfile.profile_status} />
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Right — Admin actions */}
        <Box w={{ base: 'full', md: '300px' }} flexShrink={0}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Admin Actions
            </Text>
            <Stack gap={4}>
              {/* Ban / Unban */}
              <Box>
                <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">
                  Account Status
                </Text>
                {!user.is_active && (
                  <Alert.Root status="warning" borderRadius="lg" mb={3}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description textStyle="xs">
                        This account is currently banned.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
                <Button
                  colorPalette={user.is_active ? 'red' : 'success'}
                  variant={user.is_active ? 'outline' : 'solid'}
                  size="md"
                  w="full"
                  onClick={handleToggleStatus}
                  loading={statusMutation.isPending}
                  loadingText={user.is_active ? 'Banning…' : 'Activating…'}
                >
                  {user.is_active ? 'Ban User' : 'Activate User'}
                </Button>
                <MutationErrorAlert error={statusMutation.error} />
              </Box>

              {/* Role change */}
              <Box>
                <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">
                  Change Role (current: {user.role})
                </Text>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--chakra-colors-border)',
                    background: 'var(--chakra-colors-bg-panel)',
                    color: 'var(--chakra-colors-fg)',
                    fontSize: '14px',
                    marginBottom: '8px',
                  }}
                >
                  <option value="">Select new role…</option>
                  {(['VENDOR', 'BUYER', 'ADMIN'] as const)
                    .filter((r) => r !== user.role)
                    .map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                </select>
                <Button
                  colorPalette="primary"
                  size="md"
                  w="full"
                  onClick={handleRoleChange}
                  loading={roleMutation.isPending}
                  loadingText="Updating…"
                  disabled={!selectedRole || selectedRole === user.role}
                >
                  Update Role
                </Button>
                <MutationErrorAlert error={roleMutation.error} />
              </Box>
            </Stack>
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
}
