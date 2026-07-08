'use client';
import { Box, Button, Flex, Spinner, Stack, Tabs, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  LuArrowRight,
  LuIdCard,
  LuPackage,
  LuReceipt,
  LuShieldCheck,
  LuStar,
  LuUser,
} from 'react-icons/lu';
import {
  useAdminVerifications,
  useAdminProducts,
  useAdminOrders,
} from '@/app/_hooks/admin';
import { formatCurrency } from '@/app/_lib/orderHelpers';
import type { AdminUserDetail } from '@/app/_types';
import { InfoRow } from './InfoRow';

type VendorProfile = NonNullable<AdminUserDetail['vendor_profile']>;

interface VendorTabsProps {
  vendorProfile: VendorProfile;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      textStyle="xs"
      fontWeight="semibold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="wider"
      mb={3}
    >
      {children}
    </Text>
  );
}

function ProfileTab({ vp }: { vp: VendorProfile }) {
  return (
    <Stack gap={5}>
      <Box>
        <SectionLabel>Personal Information</SectionLabel>
        <Stack gap={3}>
          <InfoRow label="First Name" value={vp.first_name} />
          <InfoRow label="Middle Name" value={vp.middle_name} />
          <InfoRow label="Last Name" value={vp.last_name} />
          <InfoRow label="Gender" value={vp.gender} />
          <InfoRow
            label="Date of Birth"
            value={vp.date_of_birth ? new Date(vp.date_of_birth).toLocaleDateString('en-NG') : null}
          />
          <InfoRow label="Phone Number" value={vp.phone_number} />
        </Stack>
      </Box>
      <Box borderTopWidth="1px" borderColor="border" pt={4}>
        <SectionLabel>Business Details</SectionLabel>
        <Stack gap={3}>
          <InfoRow label="Business Name" value={vp.business_name} />
          <InfoRow label="Description" value={vp.business_description} />
          <InfoRow label="Slug" value={vp.slug} />
          <InfoRow label="Country" value={vp.country} />
          <InfoRow label="State" value={vp.state} />
          <InfoRow label="City" value={vp.city} />
          <InfoRow label="Street Address" value={vp.street_address} />
        </Stack>
      </Box>
      <Box borderTopWidth="1px" borderColor="border" pt={4}>
        <SectionLabel>Contact & Social</SectionLabel>
        <Stack gap={3}>
          <InfoRow label="WhatsApp" value={vp.whatsapp_number} />
          <InfoRow label="Instagram" value={vp.instagram_handle} />
          <InfoRow label="TikTok" value={vp.tiktok_handle} />
          <InfoRow label="Facebook" value={vp.facebook_url} />
          <InfoRow label="Primary Contact" value={vp.primary_contact} />
        </Stack>
      </Box>
      <Box borderTopWidth="1px" borderColor="border" pt={4}>
        <SectionLabel>Payment & Refund</SectionLabel>
        <Stack gap={3}>
          <InfoRow label="Bank Name" value={vp.bank_name} />
          <InfoRow label="Account Name" value={vp.account_name} />
          <InfoRow label="Account Number" value={vp.account_number} />
          <InfoRow label="Payment Models" value={vp.payment_models.join(', ') || null} />
          <InfoRow label="Refund Policy" value={vp.refund_policy_type} />
          <InfoRow
            label="Refund Duration"
            value={vp.refund_duration_days ? `${vp.refund_duration_days} days` : null}
          />
          <InfoRow label="Refund Conditions" value={vp.refund_conditions.join(', ') || null} />
          <InfoRow label="Refund Notes" value={vp.refund_custom_notes} />
        </Stack>
      </Box>
    </Stack>
  );
}

function SummaryTab({ vp }: { vp: VendorProfile }) {
  return (
    <Stack gap={3}>
      <InfoRow label="Vendor Profile ID" value={vp.id} />
      <InfoRow label="Business Name" value={vp.business_name} />
      <InfoRow label="Current Tier" value={vp.current_tier} />
      <InfoRow label="Verification Points" value={vp.verification_points} />
      <InfoRow label="Profile Completeness" value={`${vp.profile_completeness}%`} />
      <InfoRow label="Personal Info Complete" value={vp.personal_info_complete} />
      <InfoRow label="Business Info Complete" value={vp.business_info_complete} />
      <InfoRow label="Profile Status" value={vp.profile_status} />
      <InfoRow label="Total Orders" value={vp.total_orders ?? 0} />
      <InfoRow label="Successful Orders" value={vp.successful_orders ?? 0} />
      <InfoRow label="Fulfillment Rate" value={`${vp.fulfillment_rate ?? 0}%`} />
      <InfoRow label="Refund Rate" value={`${vp.refund_rate ?? 0}%`} />
      <InfoRow label="On-Time Delivery Rate" value={`${vp.on_time_delivery_rate ?? 0}%`} />
    </Stack>
  );
}

function ReviewsTab({ vp }: { vp: VendorProfile }) {
  return (
    <Stack gap={3}>
      <InfoRow label="Review Count" value={vp.review_count ?? 0} />
      <InfoRow label="Average Rating" value={`${(vp.average_rating ?? 0).toFixed(1)} / 5`} />
      <InfoRow label="Avg Delivery Rating" value={`${(vp.avg_delivery_rating ?? 0).toFixed(1)} / 5`} />
      <InfoRow label="Avg Response Rating" value={`${(vp.avg_response_rating ?? 0).toFixed(1)} / 5`} />
      <InfoRow label="Customer Satisfaction" value={`${(vp.customer_satisfaction_rating ?? 0).toFixed(1)} / 5`} />
    </Stack>
  );
}

const STATUS_COLORS = {
  APPROVED: { bg: 'success.subtle', fg: 'success.fg' },
  REJECTED: { bg: 'red.subtle', fg: 'red.600' },
  PENDING:  { bg: 'warning.subtle', fg: 'warning.fg' },
} as const;

function VerificationsTab({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminVerifications({
    vendorId,
    limit: 5,
    sortBy: 'submitted_at',
    sortOrder: 'desc',
  });

  if (isLoading) return <Flex justify="center" py={6}><Spinner size="sm" color="primary.500" /></Flex>;

  return (
    <Stack gap={3}>
      {data?.verifications.length === 0 && (
        <Text textStyle="sm" color="fg.muted">No verifications submitted yet.</Text>
      )}
      {data?.verifications.map((v) => {
        const colors = STATUS_COLORS[v.status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.PENDING;
        return (
          <Flex
            key={v.id}
            align="center"
            justify="space-between"
            gap={2}
            p={3}
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            cursor="pointer"
            _hover={{ bg: 'bg.subtle' }}
            onClick={() => router.push(`/admin/verifications/${v.id}`)}
          >
            <Stack gap={0.5}>
              <Text textStyle="sm" fontWeight="medium">{v.type}</Text>
              <Text textStyle="xs" color="fg.muted">
                {new Date(v.submitted_at).toLocaleDateString('en-NG')}
              </Text>
            </Stack>
            <Box px={2} py={0.5} borderRadius="full" bg={colors.bg}>
              <Text textStyle="2xs" fontWeight="semibold" color={colors.fg}>
                {v.status}
              </Text>
            </Box>
          </Flex>
        );
      })}
      {(data?.pagination.total ?? 0) > 0 && (
        <Button
          size="sm" variant="ghost" colorPalette="primary" w="fit-content" px={0}
          onClick={() => router.push(`/admin/verifications?vendorId=${vendorId}`)}
        >
          View all {data?.pagination.total} verifications <LuArrowRight size={14} />
        </Button>
      )}
    </Stack>
  );
}

function ProductsTab({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminProducts({ vendor_id: vendorId, limit: 5, sort: 'newest' });

  if (isLoading) return <Flex justify="center" py={6}><Spinner size="sm" color="primary.500" /></Flex>;

  return (
    <Stack gap={3}>
      {data?.data.length === 0 && (
        <Text textStyle="sm" color="fg.muted">No products listed yet.</Text>
      )}
      {data?.data.map((p) => (
        <Flex
          key={p.id}
          align="center"
          justify="space-between"
          gap={2}
          p={3}
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          cursor="pointer"
          _hover={{ bg: 'bg.subtle' }}
          onClick={() => router.push(`/admin/products/${p.id}`)}
        >
          <Stack gap={0.5} minW={0}>
            <Flex align="center" gap={2}>
              <Text textStyle="sm" fontWeight="medium" truncate>{p.name}</Text>
              {p.is_flagged && (
                <Box px={1.5} py={0.5} borderRadius="full" bg="warning.subtle" flexShrink={0}>
                  <Text textStyle="2xs" fontWeight="semibold" color="warning.fg">Flagged</Text>
                </Box>
              )}
            </Flex>
            <Text textStyle="xs" color="fg.muted">{formatCurrency(p.price)}</Text>
          </Stack>
          <Box
            px={2} py={0.5} borderRadius="full" flexShrink={0}
            bg={p.stock_status === 'IN_STOCK' ? 'success.subtle' : 'red.subtle'}
          >
            <Text
              textStyle="2xs"
              fontWeight="semibold"
              color={p.stock_status === 'IN_STOCK' ? 'success.fg' : 'red.600'}
            >
              {p.stock_status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'}
            </Text>
          </Box>
        </Flex>
      ))}
      {(data?.total ?? 0) > 0 && (
        <Button
          size="sm" variant="ghost" colorPalette="primary" w="fit-content" px={0}
          onClick={() => router.push(`/admin/products?vendor_id=${vendorId}`)}
        >
          View all {data?.total} products <LuArrowRight size={14} />
        </Button>
      )}
    </Stack>
  );
}

function OrdersTab({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const { data, isLoading } = useAdminOrders({ vendor_id: vendorId, limit: 5 });

  if (isLoading) return <Flex justify="center" py={6}><Spinner size="sm" color="primary.500" /></Flex>;

  return (
    <Stack gap={3}>
      {data?.data.length === 0 && (
        <Text textStyle="sm" color="fg.muted">No orders yet.</Text>
      )}
      {data?.data.map((o) => (
        <Flex
          key={o.id}
          align="center"
          justify="space-between"
          gap={2}
          p={3}
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          cursor="pointer"
          _hover={{ bg: 'bg.subtle' }}
          onClick={() => router.push(`/admin/orders/${o.id}`)}
        >
          <Stack gap={0.5} minW={0}>
            <Text textStyle="sm" fontWeight="medium" truncate>#{o.reference}</Text>
            <Text textStyle="xs" color="fg.muted">
              {formatCurrency(o.total_amount)} · {new Date(o.created_at).toLocaleDateString('en-NG')}
            </Text>
          </Stack>
          <Box
            px={2} py={0.5} borderRadius="full" flexShrink={0}
            bg="bg.subtle" borderWidth="1px" borderColor="border"
          >
            <Text textStyle="2xs" fontWeight="semibold" color="fg.muted">{o.status}</Text>
          </Box>
        </Flex>
      ))}
      {(data?.total ?? 0) > 0 && (
        <Button
          size="sm" variant="ghost" colorPalette="primary" w="fit-content" px={0}
          onClick={() => router.push(`/admin/orders?vendor_id=${vendorId}`)}
        >
          View all {data?.total} orders <LuArrowRight size={14} />
        </Button>
      )}
    </Stack>
  );
}

export function VendorTabs({ vendorProfile }: VendorTabsProps) {
  return (
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
            <ProfileTab vp={vendorProfile} />
          </Tabs.Content>
          <Tabs.Content value="summary">
            <SummaryTab vp={vendorProfile} />
          </Tabs.Content>
          <Tabs.Content value="verifications">
            <VerificationsTab vendorId={vendorProfile.id} />
          </Tabs.Content>
          <Tabs.Content value="products">
            <ProductsTab vendorId={vendorProfile.id} />
          </Tabs.Content>
          <Tabs.Content value="orders">
            <OrdersTab vendorId={vendorProfile.id} />
          </Tabs.Content>
          <Tabs.Content value="reviews">
            <ReviewsTab vp={vendorProfile} />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
}
