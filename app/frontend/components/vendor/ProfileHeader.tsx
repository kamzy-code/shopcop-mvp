'use client';
import { Avatar, Box, Flex, Link, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react';
import {
  LuCalendar,
  LuFacebook,
  LuInstagram,
  LuMapPin,
  LuMessageCircle,
  LuShieldCheck,
  LuShieldAlert,
  LuTriangleAlert,
} from 'react-icons/lu';
import type { PublicVendorProfileProfile, TrustMetrics } from '@/app/_types';
import { TrustIndicators } from '@/components/vendor/TrustIndicators';

type ProfileHeaderProps = Pick<
  PublicVendorProfileProfile,
  | 'business_name'
  | 'profile_photo_url'
  | 'business_description'
  | 'state'
  | 'city'
  | 'street_address'
  | 'landmark'
  | 'primary_category'
  | 'current_tier'
  | 'payment_models'
  | 'instagram_handle'
  | 'tiktok_handle'
  | 'facebook_url'
  | 'whatsapp_number'
  | 'primary_contact'
  | 'refund_policy_type'
  | 'refund_duration_days'
  | 'refund_conditions'
  | 'refund_custom_notes'
  | 'created_at'
  | 'verified_types'
> & { trustMetrics: TrustMetrics };

function formatTier(tier: string): string {
  return tier.replace('TIER_', 'Tier ');
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
}

function formatRefundPolicy(
  type: string,
  days: number | null,
  conditions: string[],
  notes: string | null
): string {
  if (type === 'NO_REFUNDS') return 'No refunds';
  const base =
    type === 'FULL_REFUND'
      ? 'Full refund'
      : type === 'PARTIAL_REFUND'
        ? 'Partial refund'
        : 'Exchange only';
  const duration = days ? ` within ${days} days` : '';
  const extra = conditions.length > 0 ? ` · ${conditions.join(', ')}` : '';
  const note = notes ? ` · ${notes}` : '';
  return `${base}${duration}${extra}${note}`;
}

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  );
}

const PAYMENT_MODEL_LABELS: Record<string, string> = {
  FULL_PAYMENT: 'Full Payment',
  PART_PAYMENT: 'Part Payment',
  PAY_ON_DELIVERY: 'Pay on Delivery',
  INSTALLMENT: 'Installment',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BusinessHeader({
  business_name,
  profile_photo_url,
  primary_category,
  current_tier,
}: Pick<
  ProfileHeaderProps,
  'business_name' | 'profile_photo_url' | 'primary_category' | 'current_tier'
>) {
  return (
    <Flex direction="column" align="center" textAlign="center">
      <Avatar.Root size="2xl" mb={3}>
        <Avatar.Fallback name={business_name || 'V'} />
        {profile_photo_url && <Avatar.Image src={profile_photo_url} />}
      </Avatar.Root>

      <Flex justify="center" align="center" gap={2} mb={1} flexWrap="wrap">
        <Text textStyle="2xl" fontWeight="bold">
          {business_name || 'Shop'}
        </Text>
        <Box
          px={2}
          py={1}
          borderRadius="full"
          bg="primary.subtle"
          color="primary.fg"
          textStyle="2xs"
          fontWeight="medium"
        >
          {formatTier(current_tier)}
        </Box>
      </Flex>

      {primary_category && (
        <Text textStyle="sm" color="fg.muted">
          {primary_category}
        </Text>
      )}
    </Flex>
  );
}

function BusinessDescription({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <Text textStyle="sm" color="fg.muted" maxW="600px" textAlign="center">
      {description}
    </Text>
  );
}

function VerificationBadge({ verified_types }: { verified_types: string[] }) {
  const hasIdentity = verified_types.includes('NIN');
  const hasAddress = verified_types.includes('ADDRESS');
  const hasBusiness = verified_types.includes('CAC') || verified_types.includes('SMEDAN');

  // No identity — danger regardless of anything else
  if (!hasIdentity) {
    return (
      <Flex
        align="flex-start"
        gap={2.5}
        p={3}
        borderRadius="md"
        bg="red.subtle"
        borderWidth="1px"
        borderColor="red.200"
        _dark={{ borderColor: 'red.800' }}
      >
        <Box color="red.500" flexShrink={0} mt={0.5}>
          <LuTriangleAlert size={15} />
        </Box>
        <Text textStyle="xs" color="red.700" _dark={{ color: 'red.300' }} lineHeight="1.5">
          This vendor&apos;s identity has not been verified. Proceed with caution and make sure you
          trust them before transacting.
        </Text>
      </Flex>
    );
  }

  // Identity confirmed, no location — caution
  if (!hasAddress) {
    return (
      <Flex
        align="flex-start"
        gap={2.5}
        p={3}
        borderRadius="md"
        bg="yellow.subtle"
        borderWidth="1px"
        borderColor="yellow.200"
        _dark={{ borderColor: 'yellow.800' }}
      >
        <Box color="yellow.600" flexShrink={0} mt={0.5}>
          <LuShieldAlert size={15} />
        </Box>
        <Text textStyle="xs" color="yellow.800" _dark={{ color: 'yellow.200' }} lineHeight="1.5">
          Identity verified. Location has not been confirmed — we recommend verifying the
          vendor&apos;s address before transacting.
        </Text>
      </Flex>
    );
  }

  // Identity + location + registered business — fully verified
  if (hasBusiness) {
    return (
      <Flex
        align="flex-start"
        gap={2.5}
        p={3}
        borderRadius="md"
        bg="purple.subtle"
        borderWidth="1px"
        borderColor="purple.200"
        _dark={{ borderColor: 'purple.800' }}
      >
        <Box color="purple.600" flexShrink={0} mt={0.5}>
          <LuShieldCheck size={15} />
        </Box>
        <Text textStyle="xs" color="purple.700" _dark={{ color: 'purple.300' }} lineHeight="1.5">
          Identity, location, and business registration all verified by ShopCop. This is a fully
          verified vendor.
        </Text>
      </Flex>
    );
  }

  // Identity + location — safe
  return (
    <Flex
      align="flex-start"
      gap={2.5}
      p={3}
      borderRadius="md"
      bg="green.subtle"
      borderWidth="1px"
      borderColor="green.200"
      _dark={{ borderColor: 'green.800' }}
    >
      <Box color="green.600" flexShrink={0} mt={0.5}>
        <LuShieldCheck size={15} />
      </Box>
      <Text textStyle="xs" color="green.700" _dark={{ color: 'green.300' }} lineHeight="1.5">
        Identity and location verified by ShopCop. You can transact with confidence.
      </Text>
    </Flex>
  );
}

function BusinessMeta({
  state,
  city,
  street_address,
  landmark,
  created_at,
  verified_types,
}: {
  state: string | null;
  city: string | null;
  street_address: string | null;
  landmark: string | null;
  created_at: string;
  verified_types: string[];
}) {
  return (
    <Stack gap={2} p={3} borderWidth="1px" borderRadius="lg" bg="bg.subtle">
      {(street_address || landmark || state || city) && (
        <Flex align="center" gap={2}>
          <Box flexShrink={0} color="fg.muted">
            <LuMapPin size={14} />
          </Box>
          <Text textStyle="sm" color="fg.muted">
            {[street_address, landmark, city, state].filter(Boolean).join(', ')}
          </Text>
        </Flex>
      )}
      <Flex align="center" gap={2}>
        <Box flexShrink={0} color="fg.muted">
          <LuCalendar size={14} />
        </Box>
        <Text textStyle="sm" color="fg.muted">
          Member since {formatMemberSince(created_at)}
        </Text>
      </Flex>
      <VerificationBadge verified_types={verified_types} />
    </Stack>
  );
}

function BusinessRefundPolicy({ refundLabel }: { refundLabel: string }) {
  return (
    <Box px={3} py={2} bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="lg">
      <Text textStyle="xs" color="fg.muted">
        <Text as="span" fontWeight="semibold" color="fg.default">
          Refund policy:{' '}
        </Text>
        {refundLabel}
      </Text>
    </Box>
  );
}


function BusinessPaymentModels({ payment_models }: { payment_models: string[] }) {
  if (payment_models.length === 0) return null;
  return (
    <Box>
      <Text textStyle="xs" fontWeight="semibold" color="fg.muted" mb={2} letterSpacing="wider">
        ACCEPTED PAYMENT METHODS
      </Text>
      <Flex gap={2} flexWrap="wrap">
        {payment_models.map((model) => (
          <Box
            key={model}
            px={3}
            py={1}
            borderRadius="full"
            borderWidth="1px"
            borderColor="border"
            bg="bg.subtle"
            textStyle="xs"
            color="fg.muted"
            fontWeight="medium"
          >
            {PAYMENT_MODEL_LABELS[model] ?? model}
          </Box>
        ))}
      </Flex>
    </Box>
  );
}

function BusinessSocialLinks({
  socialLinks,
}: {
  socialLinks: Array<{ icon: React.ElementType; href: string; label: string; color: string }>;
}) {
  if (socialLinks.length === 0) return null;
  return (
    <Box>
      <Text textStyle="xs" fontWeight="semibold" color="fg.muted" mb={2} letterSpacing="wider">
        SOCIAL
      </Text>
      <Flex gap={1} flexWrap="wrap">
        {socialLinks.map(({ icon: Icon, href, label, color }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            px={3}
            h={8}
            borderRadius="md"
            color={color}
            _hover={{ bg: 'bg.subtle' }}
          >
            <Icon size={18} />
            <Text textStyle={'sm'}>{label}</Text>
          </Link>
        ))}
      </Flex>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileHeader({
  business_name,
  profile_photo_url,
  business_description,
  state,
  city,
  street_address,
  landmark,
  primary_category,
  current_tier,
  payment_models,
  instagram_handle,
  tiktok_handle,
  facebook_url,
  whatsapp_number,
  refund_policy_type,
  refund_duration_days,
  refund_conditions,
  refund_custom_notes,
  created_at,
  verified_types,
  trustMetrics,
}: ProfileHeaderProps) {
  const socialLinks = [
    instagram_handle && {
      icon: LuInstagram,
      href: instagram_handle,
      label: 'Instagram',
      color: 'pink.500',
    },
    tiktok_handle && {
      icon: TikTokIcon,
      href: tiktok_handle,
      label: 'TikTok',
      color: 'fg.default',
    },
    facebook_url && {
      icon: LuFacebook,
      href: facebook_url,
      label: 'Facebook',
      color: 'blue.500',
    },
    whatsapp_number && {
      icon: LuMessageCircle,
      href: `https://wa.me/${whatsapp_number.replace(/\D/g, '')}`,
      label: 'WhatsApp',
      color: 'green.500',
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    href: string;
    label: string;
    color: string;
  }>;

  const trustMeticsInfo = [
    {
      label: 'Completed Transactions',
      value: String(trustMetrics.successful_transactions),
      color: 'success.fg',
    },
    {
      label: 'Avg Rating',
      value: trustMetrics.average_rating > 0 ? `${trustMetrics.average_rating.toFixed(1)} ★` : '—',
      color: 'rating.500',
    },
    {
      label: 'Avg Response Time',
      value: (() => {
        const m = trustMetrics.avg_response_time_minutes;
        if (m <= 0) return 'N/A';
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
      })(),
      color: 'primary.fg',
    },
  ];

  const refundLabel = formatRefundPolicy(
    refund_policy_type,
    refund_duration_days,
    refund_conditions,
    refund_custom_notes
  );

  return (
    <Stack gap={5}>
      <VStack>
        <BusinessHeader
          business_name={business_name}
          profile_photo_url={profile_photo_url}
          primary_category={primary_category}
          current_tier={current_tier}
        />

        <BusinessDescription description={business_description} />
      </VStack>

      <BusinessMeta
        street_address={street_address}
        landmark={landmark}
        state={state}
        city={city}
        created_at={created_at}
        verified_types={verified_types}
      />

      {/* Stats row */}
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
        <SimpleGrid columns={3} divideX="1px">
          {trustMeticsInfo.map(({ label, value, color }) => (
            <Box key={label} textAlign="center" py={4} px={2}>
              <Text textStyle="xl" fontWeight="bold" color={color as string} lineHeight="1.2">
                {value}
              </Text>
              <Text textStyle="2xs" color="fg.muted" mt={0.5} fontWeight="medium">
                {label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <TrustIndicators metrics={trustMetrics} />

      <BusinessRefundPolicy refundLabel={refundLabel} />

      <BusinessPaymentModels payment_models={payment_models} />

      <BusinessSocialLinks socialLinks={socialLinks} />
    </Stack>
  );
}
