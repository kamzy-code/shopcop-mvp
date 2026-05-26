import { Box, Text } from '@chakra-ui/react';
import { VendorTier } from '@/app/_types';

const TIER_CONFIG: Record<VendorTier, { label: string; palette: string }> = {
  TIER_0: { label: 'Tier 0', palette: 'gray' },
  TIER_1: { label: 'Tier 1', palette: 'primary' },
  TIER_2: { label: 'Tier 2', palette: 'success' },
  TIER_3: { label: 'Tier 3', palette: 'warning' },
  TIER_4: { label: 'Tier 4', palette: 'purple' },
};

interface TierBadgeProps {
  tier: VendorTier;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const { label, palette } = TIER_CONFIG[tier] ?? TIER_CONFIG.TIER_0;
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      px={size === 'sm' ? 2 : 3}
      py={size === 'sm' ? 0.5 : 1}
      borderRadius="full"
      bg={`${palette}.subtle`}
      borderWidth="1px"
      borderColor={`${palette}.200`}
    >
      <Text
        textStyle={size === 'sm' ? '2xs' : 'xs'}
        fontWeight="semibold"
        color={`${palette}.fg`}
        textTransform="uppercase"
        letterSpacing="wider"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Box>
  );
}
