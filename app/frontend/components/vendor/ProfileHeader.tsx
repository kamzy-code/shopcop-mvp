'use client';
import { Avatar, Box, Flex, Link, Text } from '@chakra-ui/react';
import {
  LuCalendar,
  LuFacebook,
  LuInstagram,
  LuMapPin,
  LuMessageCircle,
  LuStore,
} from 'react-icons/lu';
import type { PublicVendorProfileProfile } from '@/app/_types';

type ProfileHeaderProps = Pick<
  PublicVendorProfileProfile,
  | 'business_name'
  | 'profile_photo_url'
  | 'business_description'
  | 'state'
  | 'city'
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
>;

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

/** TikTok icon — not in lucide-react, render as simple SVG text badge. */
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

export function ProfileHeader({
  business_name,
  profile_photo_url,
  business_description,
  state,
  city,
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
}: ProfileHeaderProps) {
  const socialLinks = [
    instagram_handle && {
      icon: LuInstagram,
      href: `https://instagram.com/${instagram_handle.replace('@', '')}`,
      label: instagram_handle,
      color: 'pink.500',
    },
    tiktok_handle && {
      icon: TikTokIcon,
      href: `https://tiktok.com/@${tiktok_handle.replace('@', '')}`,
      label: tiktok_handle,
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
  ].filter(Boolean) as {
    icon: React.ElementType;
    href: string;
    label: string;
    color: string;
  }[];

  const refundLabel = formatRefundPolicy(
    refund_policy_type,
    refund_duration_days,
    refund_conditions,
    refund_custom_notes
  );

  return (
    <Box>
      <Flex gap={4} align="flex-start">
        <Avatar.Root size="2xl">
          <Avatar.Fallback name={business_name || 'V'} />
          {profile_photo_url && <Avatar.Image src={profile_photo_url} />}
        </Avatar.Root>

        <Box flex={1}>
          <Flex align="center" gap={2} mb={1} flexWrap="wrap">
            <Text textStyle="2xl" fontWeight="bold">
              {business_name || 'Shop'}
            </Text>
            <Box
              px={2}
              py={0.5}
              borderRadius="full"
              bg="primary.subtle"
              color="primary.fg"
              textStyle="xs"
              fontWeight="medium"
            >
              {formatTier(current_tier)}
            </Box>
          </Flex>

          {primary_category && (
            <Flex align="center" gap={1} mb={1} color="fg.muted">
              <LuStore size={14} />
              <Text textStyle="sm">{primary_category}</Text>
            </Flex>
          )}

          {(state || city) && (
            <Flex align="center" gap={1} mb={1} color="fg.muted">
              <LuMapPin size={14} />
              <Text textStyle="sm">{[city, state].filter(Boolean).join(', ')}</Text>
            </Flex>
          )}

          <Flex align="center" gap={1} color="fg.muted">
            <LuCalendar size={14} />
            <Text textStyle="xs">Member since {formatMemberSince(created_at)}</Text>
          </Flex>

          {business_description && (
            <Text textStyle="sm" color="fg.muted" mt={2}>
              {business_description}
            </Text>
          )}
        </Box>
      </Flex>

      {/* Refund policy */}
      <Box
        mt={3}
        px={3}
        py={2}
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
      >
        <Text textStyle="xs" color="fg.muted">
          <Text as="span" fontWeight="semibold" color="fg.default">
            Refund policy:{' '}
          </Text>
          {refundLabel}
        </Text>
      </Box>

      {/* Payment models */}
      {payment_models.length > 0 && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {payment_models.map((model) => (
            <Box
              key={model}
              px={2}
              py={0.5}
              borderRadius="full"
              borderWidth="1px"
              borderColor="border"
              bg="bg.subtle"
              textStyle="2xs"
              color="fg.muted"
              fontWeight="medium"
            >
              {PAYMENT_MODEL_LABELS[model] ?? model}
            </Box>
          ))}
        </Flex>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <Flex gap={3} mt={3} flexWrap="wrap">
          {socialLinks.map(({ icon: Icon, href, label, color }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              display="flex"
              alignItems="center"
              gap={1}
              color={color}
              textStyle="xs"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </Flex>
      )}
    </Box>
  );
}
