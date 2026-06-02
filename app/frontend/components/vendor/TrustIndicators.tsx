'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuCircleCheck, LuClock, LuPercent, LuStar, LuRefreshCw } from 'react-icons/lu';
import type { TrustMetrics } from '@/app/_types';

interface TrustIndicatorsProps {
  metrics: TrustMetrics;
}

function Indicator({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Flex gap={3} align="center" p={3} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="lg">
      <Box color={color || 'primary.fg'}>
        <Icon size={20} />
      </Box>
      <Box>
        <Text textStyle="sm" fontWeight="semibold">
          {value}
        </Text>
        <Text textStyle="xs" color="fg.muted">
          {label}
        </Text>
      </Box>
    </Flex>
  );
}

export function TrustIndicators({ metrics }: TrustIndicatorsProps) {
  return (
    <Box>
      <Text textStyle="sm" fontWeight="semibold" mb={3}>
        Trust Indicators
      </Text>
      <Flex gap={3} flexWrap="wrap">
        <Indicator
          icon={LuCircleCheck}
          label="Fulfillment Rate"
          value={`${metrics.fulfillment_rate}%`}
          color="green.500"
        />
        <Indicator
          icon={LuPercent}
          label="Customer Satisfaction"
          value={`${metrics.customer_satisfaction_rate}%`}
          color="blue.500"
        />
        <Indicator
          icon={LuStar}
          label="Average Rating"
          value={metrics.average_rating.toFixed(1)}
          color="yellow.500"
        />
        <Indicator
          icon={LuRefreshCw}
          label="Refund Rate"
          value={`${metrics.refund_rate}%`}
          color={metrics.refund_rate > 10 ? 'red.500' : 'fg.muted'}
        />
        <Indicator
          icon={LuClock}
          label="Avg Response Time"
          value={metrics.avg_response_time_minutes > 0 ? `${metrics.avg_response_time_minutes}m` : 'N/A'}
          color="purple.500"
        />
        <Indicator
          icon={LuCircleCheck}
          label="On-Time Delivery"
          value={`${metrics.on_time_delivery_rate}%`}
          color="teal.500"
        />
      </Flex>
    </Box>
  );
}
