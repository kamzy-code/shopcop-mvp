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
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuShieldCheck, LuPackage, LuReceipt, LuStar, LuUser, LuIdCard } from 'react-icons/lu';
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
      <Text textStyle="sm" color="fg" fontWeight="medium" minW={0} wordBreak="break-word">
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

  const vendorProfile = user.vendor_profile;
  const buyerProfile = user.buyer_profile;

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

          {/* Buyer profile (if any) */}
          {buyerProfile && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Buyer Profile
              </Text>
              <Stack gap={3}>
                <InfoRow label="Profile ID" value={buyerProfile.id} />
                <InfoRow label="Display Name" value={buyerProfile.name} />
                <InfoRow label="Created" value={new Date(buyerProfile.created_at).toLocaleString('en-NG')} />
              </Stack>
            </Box>
          )}

          {/* Vendor profile (if any) */}
          {vendorProfile && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Tabs.Root defaultValue="profile">
                <Tabs.List gap={{ base: 2, sm: 0 }} flexWrap="wrap">
                  <Tabs.Trigger value="profile">
                    <LuIdCard size={16} />
                    <Box hideBelow="sm">Profile</Box>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="summary">
                    <LuUser size={16} />
                    <Box hideBelow="sm">Summary</Box>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="verifications">
                    <LuShieldCheck size={16} />
                    <Box hideBelow="sm">Verifications</Box>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="products">
                    <LuPackage size={16} />
                    <Box hideBelow="sm">Products</Box>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="orders">
                    <LuReceipt size={16} />
                    <Box hideBelow="sm">Orders</Box>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="reviews">
                    <LuStar size={16} />
                    <Box hideBelow="sm">Reviews</Box>
                  </Tabs.Trigger>
                </Tabs.List>

                <Box pt={5}>
                  <Tabs.Content value="profile">
                    <Stack gap={5}>
                      <Box>
                        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
                          Personal Information
                        </Text>
                        <Stack gap={3}>
                          <InfoRow label="First Name" value={vendorProfile.first_name} />
                          <InfoRow label="Middle Name" value={vendorProfile.middle_name} />
                          <InfoRow label="Last Name" value={vendorProfile.last_name} />
                          <InfoRow label="Gender" value={vendorProfile.gender} />
                          <InfoRow label="Date of Birth" value={vendorProfile.date_of_birth ? new Date(vendorProfile.date_of_birth).toLocaleDateString('en-NG') : null} />
                          <InfoRow label="Phone Number" value={vendorProfile.phone_number} />
                        </Stack>
                      </Box>
                      <Box borderTopWidth="1px" borderColor="border" pt={4}>
                        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
                          Business Details
                        </Text>
                        <Stack gap={3}>
                          <InfoRow label="Business Name" value={vendorProfile.business_name} />
                          <InfoRow label="Description" value={vendorProfile.business_description} />
                          <InfoRow label="Slug" value={vendorProfile.slug} />
                          <InfoRow label="Country" value={vendorProfile.country} />
                          <InfoRow label="State" value={vendorProfile.state} />
                          <InfoRow label="City" value={vendorProfile.city} />
                          <InfoRow label="Street Address" value={vendorProfile.street_address} />
                        </Stack>
                      </Box>
                      <Box borderTopWidth="1px" borderColor="border" pt={4}>
                        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
                          Contact & Social
                        </Text>
                        <Stack gap={3}>
                          <InfoRow label="WhatsApp" value={vendorProfile.whatsapp_number} />
                          <InfoRow label="Instagram" value={vendorProfile.instagram_handle} />
                          <InfoRow label="TikTok" value={vendorProfile.tiktok_handle} />
                          <InfoRow label="Facebook" value={vendorProfile.facebook_url} />
                          <InfoRow label="Primary Contact" value={vendorProfile.primary_contact} />
                        </Stack>
                      </Box>
                      <Box borderTopWidth="1px" borderColor="border" pt={4}>
                        <Text textStyle="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
                          Payment & Refund
                        </Text>
                        <Stack gap={3}>
                          <InfoRow label="Bank Name" value={vendorProfile.bank_name} />
                          <InfoRow label="Account Name" value={vendorProfile.account_name} />
                          <InfoRow label="Account Number" value={vendorProfile.account_number} />
                          <InfoRow label="Payment Models" value={vendorProfile.payment_models.join(', ') || null} />
                          <InfoRow label="Refund Policy" value={vendorProfile.refund_policy_type} />
                          <InfoRow label="Refund Duration" value={vendorProfile.refund_duration_days ? `${vendorProfile.refund_duration_days} days` : null} />
                          <InfoRow label="Refund Conditions" value={vendorProfile.refund_conditions.join(', ') || null} />
                          <InfoRow label="Refund Notes" value={vendorProfile.refund_custom_notes} />
                        </Stack>
                      </Box>
                    </Stack>
                  </Tabs.Content>

                  <Tabs.Content value="summary">
                    <Stack gap={3}>
                      <InfoRow label="Vendor Profile ID" value={vendorProfile.id} />
                      <InfoRow label="Business Name" value={vendorProfile.business_name} />
                      <InfoRow label="Current Tier" value={vendorProfile.current_tier} />
                      <InfoRow label="Verification Points" value={vendorProfile.verification_points} />
                      <InfoRow label="Profile Completeness" value={`${vendorProfile.profile_completeness}%`} />
                      <InfoRow label="Personal Info Complete" value={vendorProfile.personal_info_complete} />
                      <InfoRow label="Business Info Complete" value={vendorProfile.business_info_complete} />
                      <InfoRow label="Profile Status" value={vendorProfile.profile_status} />
                      <InfoRow label="Total Orders" value={vendorProfile.total_orders ?? 0} />
                      <InfoRow label="Successful Orders" value={vendorProfile.successful_orders ?? 0} />
                      <InfoRow label="Fulfillment Rate" value={`${vendorProfile.fulfillment_rate ?? 0}%`} />
                      <InfoRow label="Refund Rate" value={`${vendorProfile.refund_rate ?? 0}%`} />
                      <InfoRow label="On-Time Delivery Rate" value={`${vendorProfile.on_time_delivery_rate ?? 0}%`} />
                    </Stack>
                  </Tabs.Content>

                  <Tabs.Content value="verifications">
                    <Stack gap={3}>
                      <Text textStyle="sm" color="fg.muted">
                       {` View this vendor's verification submissions and approval history.`}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="primary"
                        w="fit-content"
                        onClick={() => router.push(`/admin/verifications?vendorId=${vendorProfile.id}`)}
                      >
                        View All Verifications <LuArrowRight size={14} />
                      </Button>
                    </Stack>
                  </Tabs.Content>

                  <Tabs.Content value="products">
                    <Stack gap={3}>
                      <Text textStyle="sm" color="fg.muted">
                        View every product this vendor has listed, including flagged and archived items.
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="primary"
                        w="fit-content"
                        onClick={() => router.push(`/admin/products?vendor_id=${vendorProfile.id}`)}
                      >
                        View All Products <LuArrowRight size={14} />
                      </Button>
                    </Stack>
                  </Tabs.Content>

                  <Tabs.Content value="orders">
                    <Stack gap={3}>
                      <Text textStyle="sm" color="fg.muted">
                       {` View this vendor's order history, payments, and refunds.`}
                      </Text>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="primary"
                        w="fit-content"
                        onClick={() => router.push(`/admin/orders?vendor_id=${vendorProfile.id}`)}
                      >
                        View All Orders <LuArrowRight size={14} />
                      </Button>
                    </Stack>
                  </Tabs.Content>

                  <Tabs.Content value="reviews">
                    <Stack gap={3}>
                      <InfoRow label="Review Count" value={vendorProfile.review_count ?? 0} />
                      <InfoRow label="Average Rating" value={`${(vendorProfile.average_rating ?? 0).toFixed(1)} / 5`} />
                      <InfoRow label="Avg Delivery Rating" value={`${(vendorProfile.avg_delivery_rating ?? 0).toFixed(1)} / 5`} />
                      <InfoRow label="Avg Response Rating" value={`${(vendorProfile.avg_response_rating ?? 0).toFixed(1)} / 5`} />
                      <InfoRow label="Customer Satisfaction" value={`${(vendorProfile.customer_satisfaction_rating ?? 0).toFixed(1)} / 5`} />
                    </Stack>
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
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
