'use client';
import { useState } from 'react';
import { Alert, Box, Button, Stack, Text } from '@chakra-ui/react';
import { useAdminUpdateUserStatus, useAdminUpdateUserRole } from '@/app/_hooks/admin';
import { toaster } from '@/components/ui/toaster';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';
import type { AdminUserDetail } from '@/app/_types';

interface AdminActionsPanelProps {
  user: AdminUserDetail;
}

export function AdminActionsPanel({ user }: AdminActionsPanelProps) {
  const statusMutation = useAdminUpdateUserStatus();
  const roleMutation = useAdminUpdateUserRole();

  const [selectedRole, setSelectedRole] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false, title: '', description: '',
  });

  const handleToggleStatus = async () => {
    const newStatus = !user.is_active;
    try {
      await statusMutation.mutateAsync({ id: user.id, is_active: newStatus });
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
      await roleMutation.mutateAsync({ id: user.id, role: selectedRole as 'VENDOR' | 'BUYER' | 'ADMIN' });
      setRoleDialogOpen(false);
      toaster.create({ title: 'Role Updated', description: `User role changed to ${selectedRole}.`, type: 'success' });
      setSelectedRole('');
    } catch (error) {
      setRoleDialogOpen(false);
      const message = error instanceof Error ? error.message : 'Failed to update role.';
      setErrorModal({ open: true, title: 'Role Change Failed', description: message });
    }
  };

  return (
    <>
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

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
        <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
          Admin Actions
        </Text>
        <Stack gap={4}>
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
                  <option key={role} value={role}>{role}</option>
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
    </>
  );
}
