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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false, title: '', description: '',
  });

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
      setStatusDialogOpen(false);
      toaster.create({
        title: newStatus ? 'User Activated' : 'User Banned',
        description: `User account has been ${newStatus ? 'activated' : 'deactivated'}.`,
        type: newStatus ? 'success' : 'info',
      });
    } catch (error) {
      setStatusDialogOpen(false);
      const message = error instanceof Error ? error.message : 'Failed to update status.';
      setErrorModal({ open: true, title: newStatus ? 'Activation Failed' : 'Ban Failed', description: message });
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === user.role) return;
    try {
      await roleMutation.mutateAsync({ id, role: selectedRole as 'VENDOR' | 'BUYER' | 'ADMIN' });
      setRoleDialogOpen(false);
      toaster.create({
        title: 'Role Updated',
        description: `User role changed to ${selectedRole}.`,
        type: 'success',
      });
      setSelectedRole('');
    } catch (error) {
      setRoleDialogOpen(false);
      const message = error instanceof Error ? error.message : 'Failed to update role.';
      setErrorModal({ open: true, title: 'Role Change Failed', description: message });
    }
  };

  const vendorProfile = (user as any).vendor_profile;

  return (
    <Stack gap={8}>
      <ConfirmDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleToggleStatus}
        title={user.is_active ? 'Ban User' : 'Activate User'}
        description={
          user.is_active
            ? `Are you sure you want to ban ${user.name || user.email}? They will lose access to the platform.`
            : `Are you sure you want to activate ${user.name || user.email}? They will regain access to the platform.`
        }
        confirmLabel={user.is_active ? 'Ban User' : 'Activate User'}
        colorPalette={user.is_active ? 'red' : 'success'}
        isLoading={statusMutation.isPending}
      />
      <ConfirmDialog
        open={roleDialogOpen}
        onClose={() => { setRoleDialogOpen(false); setSelectedRole(''); }}
        onConfirm={handleRoleChange}
        title="Change User Role"
        description={`Change ${user.name || user.email}'s role from ${user.role} to ${selectedRole}?`}
        confirmLabel="Update Role"
        colorPalette="navy"
        isLoading={roleMutation.isPending}
      />
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />
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
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {user.is_active ? 'Ban User' : 'Activate User'}
                </Button>
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
                  onClick={() => selectedRole && selectedRole !== user.role && setRoleDialogOpen(true)}
                  disabled={!selectedRole || selectedRole === user.role}
                >
                  Update Role
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
}
