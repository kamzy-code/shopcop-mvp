'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuShoppingCart, LuCircleCheck, LuStar, LuRefreshCw } from 'react-icons/lu';

interface MetricsCardProps {
  label: string;
  value: string | number;
  icon?: 'orders' | 'fulfillment' | 'rating' | 'refund';
}

const ICON_MAP = {
  orders: LuShoppingCart,
  fulfillment: LuCircleCheck,
  rating: LuStar,
  refund: LuRefreshCw,
};

export function MetricsCard({ label, value, icon }: MetricsCardProps) {
  const Icon = icon ? ICON_MAP[icon] : null;

  return (
    <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" minW="120px">
      <Flex direction="column" align="center" gap={1}>
        {Icon && (
          <Box color="primary.fg" mb={1}>
            <Icon size={20} />
          </Box>
        )}
        <Text textStyle="2xl" fontWeight="bold" lineHeight="1">
          {value}
        </Text>
        <Text textStyle="xs" color="fg.muted" textAlign="center">
          {label}
        </Text>
      </Flex>
    </Box>
  );
}
