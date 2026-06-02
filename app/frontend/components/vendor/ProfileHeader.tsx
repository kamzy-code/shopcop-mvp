'use client';
import { Avatar, Box, Flex, Text } from '@chakra-ui/react';
import { LuMapPin, LuStore } from 'react-icons/lu';

interface ProfileHeaderProps {
  business_name: string | null;
  profile_photo_url: string | null;
  business_description: string | null;
  state: string | null;
  city: string | null;
  primary_category: string | null;
  current_tier: string;
}

function formatTier(tier: string): string {
  return tier.replace('TIER_', 'Tier ');
}

export function ProfileHeader({
  business_name,
  profile_photo_url,
  business_description,
  state,
  city,
  primary_category,
  current_tier,
}: ProfileHeaderProps) {
  return (
    <Flex gap={4} align="flex-start">
      <Avatar.Root size="2xl">
        <Avatar.Fallback name={business_name || 'V'} />
        {profile_photo_url && <Avatar.Image src={profile_photo_url} />}
      </Avatar.Root>

      <Box flex={1}>
        <Flex align="center" gap={2} mb={1}>
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

        {business_description && (
          <Text textStyle="sm" color="fg.muted" mt={2}>
            {business_description}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
