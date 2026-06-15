'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuTruck } from 'react-icons/lu';
import { Order } from '@/app/_types';
import { formatDate } from '@/app/_lib/orderHelpers';

export function DeliveryBanner({ tx }: { tx: Order }) {
  if (!tx.expected_delivery_start && !tx.expected_delivery_end) return null;

  const isLate = tx.expected_delivery_end
    ? new Date() > new Date(tx.expected_delivery_end) &&
      !['DELIVERED', 'COMPLETED'].includes(tx.status)
    : false;

  return (
    <Box
      p={4}
      bg={isLate ? 'orange.subtle' : 'primary.subtle'}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isLate ? 'orange.200' : 'primary.200'}
      _dark={isLate ? { borderColor: 'orange.800' } : {}}
    >
      <Flex align="center" gap={2} mb={1}>
        <Box
          color={isLate ? 'orange.700' : 'primary.fg'}
          _dark={isLate ? { color: 'orange.300' } : {}}
          display="flex"
          alignItems="center"
        >
          <LuTruck size={16} />
        </Box>
        <Text
          textStyle="sm"
          fontWeight="semibold"
          color={isLate ? 'orange.700' : 'primary.fg'}
          _dark={isLate ? { color: 'orange.300' } : {}}
        >
          {isLate ? 'Expected delivery may be delayed' : 'Expected Delivery Window'}
        </Text>
      </Flex>
      <Text
        textStyle="sm"
        color={isLate ? 'orange.600' : 'primary.fg'}
        _dark={isLate ? { color: 'orange.400' } : {}}
      >
        {tx.expected_delivery_start && tx.expected_delivery_end
          ? `${formatDate(tx.expected_delivery_start)} – ${formatDate(tx.expected_delivery_end)}`
          : formatDate(tx.expected_delivery_start ?? tx.expected_delivery_end)}
      </Text>
    </Box>
  );
}
