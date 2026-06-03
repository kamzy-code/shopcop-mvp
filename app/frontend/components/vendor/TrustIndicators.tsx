'use client';
import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import {
  LuCircleCheck,
  LuClock,
  LuRefreshCw,
  LuSmile,
  LuStar,
  LuThumbsUp,
  LuTruck,
  LuZap,
} from 'react-icons/lu';
import type { TrustMetrics } from '@/app/_types';

interface TrustIndicatorsProps {
  metrics: TrustMetrics;
}

/** Format a minute value into a human-readable string. */
function formatMinutes(minutes: number): string {
  if (minutes <= 0) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
    <Flex
      gap={3}
      align="center"
      p={3}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
    >
      <Box color={color || 'primary.fg'} flexShrink={0}>
        <Icon size={18} />
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
      {/* ── Performance Metrics (system, transaction-derived) ─────────────────── */}
      <Text textStyle="sm" fontWeight="semibold" mb={2}>
        Performance
      </Text>
      <SimpleGrid columns={{ base: 2, sm: 3 }} gap={2} mb={5}>
        <Indicator
          icon={LuCircleCheck}
          label="Fulfillment Rate"
          value={`${Math.round(metrics.fulfillment_rate)}%`}
          color="green.500"
        />
        <Indicator
          icon={LuTruck}
          label="On-Time Delivery"
          value={`${Math.round(metrics.on_time_delivery_rate)}%`}
          color="teal.500"
        />
        <Indicator
          icon={LuClock}
          label="Avg. Payment Confirmation"
          value={formatMinutes(metrics.avg_response_time_minutes)}
          color="purple.500"
        />
        <Indicator
          icon={LuRefreshCw}
          label="Refund Rate"
          value={`${Math.round(metrics.refund_rate)}%`}
          color={metrics.refund_rate > 10 ? 'red.500' : 'fg.muted'}
        />
      </SimpleGrid>

      {/* ── Customer Feedback (buyer-rated, review-derived) ───────────────────── */}
      {
      //metrics.review_count > 0 &&
       (
        <>
          <Text textStyle="sm" fontWeight="semibold" mb={2}>
            Customer Feedback
          </Text>
          <SimpleGrid columns={{ base: 2, sm: 3 }} gap={2}>
            <Indicator
              icon={LuStar}
              label="Overall Rating"
              value={`${metrics.average_rating.toFixed(1)} / 5`}
              color="yellow.500"
            />
            {
            //metrics.avg_delivery_rating > 0 &&
             (
              <Indicator
                icon={LuTruck}
                label="Delivery Experience"
                value={`${metrics.avg_delivery_rating.toFixed(1)} / 5`}
                color="blue.500"
              />
            )}
            {
            //metrics.avg_response_rating > 0 &&
             (
              <Indicator
                icon={LuZap}
                label="Responsiveness"
                value={`${metrics.avg_response_rating.toFixed(1)} / 5`}
                color="orange.500"
              />
            )}
            {
            //metrics.customer_satisfaction_rating > 0 &&
             (
              <Indicator
                icon={metrics.customer_satisfaction_rating >= 4 ? LuSmile : LuThumbsUp}
                label="Customer Satisfaction"
                value={`${metrics.customer_satisfaction_rating.toFixed(1)} / 5`}
                color="pink.500"
              />
            )}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
