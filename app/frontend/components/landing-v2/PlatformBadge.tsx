'use client';
import { Flex, Icon, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface PlatformBadgeProps {
  icon?: IconType;
  label: string;
  highlight?: boolean;
}

export function PlatformBadge({ icon, label, highlight = false }: PlatformBadgeProps) {
  return (
    <Flex
      align="center"
      gap={2}
      px={4}
      py={2}
      borderRadius="full"
      bg={highlight ? 'primary.300' : 'white/10'}
      borderWidth={highlight ? '0' : '1px'}
      borderColor="white/20"
    >
      {icon && <Icon as={icon} boxSize={4} color="white" />}
      {label && (
        <Text textStyle="xs" fontWeight="medium" color={highlight ? 'primary.700' : 'white'}>
          {label}
        </Text>
      )}
    </Flex>
  );
}
