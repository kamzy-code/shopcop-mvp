'use client';
import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import type { TrustMetrics } from '@/app/_types';

interface TrustIndicatorsProps {
  metrics: TrustMetrics;
}

/** SVG donut ring — value is 0–100. */
function CircleRing({
  value,
  label,
  color = '#319795',
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const SIZE = 60;
  const STROKE = 5;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (fill / 100) * circumference;

  return (
    <Flex direction="column" align="center" gap={1.5} py={3} px={2}>
      <Box position="relative" w={`${SIZE}px`} h={`${SIZE}px`} flexShrink={0}>
        <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke="currentColor"
            strokeWidth={STROKE} style={{ color: 'var(--chakra-colors-border, #e2e8f0)', opacity: 0.4 }} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={radius} fill="none" stroke={color}
            strokeWidth={STROKE} strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <Flex position="absolute" inset={0} align="center" justify="center">
          <Text textStyle="2xs" fontWeight="bold" color="fg">{Math.round(fill)}%</Text>
        </Flex>
      </Box>
      <Text textStyle="2xs" color="fg.muted" fontWeight="medium" textAlign="center" lineHeight="1.3">
        {label}
      </Text>
    </Flex>
  );
}

export function TrustIndicators({ metrics }: TrustIndicatorsProps) {
  return (
    <Box>
      <Text textStyle="xs" color="fg.muted" fontWeight="semibold" mb={2} letterSpacing="wider">
        PERFORMANCE METRICS
      </Text>
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
        <SimpleGrid columns={3} divideX="1px">
          <CircleRing value={metrics.fulfillment_rate} label="Order Fulfilment" color="#319795" />
          <CircleRing value={metrics.on_time_delivery_rate} label="On-Time Delivery" color="#6366f1" />
          <CircleRing value={Math.max(0, 100 - metrics.refund_rate)} label="No Refund Rate" color="#10b981" />
        </SimpleGrid>
      </Box>
    </Box>
  );
}

// ─── Exported for use in the Reviews tab ─────────────────────────────────────

export function CustomerFeedbackStats({ metrics }: { metrics: TrustMetrics }) {
  const items = [
    metrics.avg_delivery_rating > 0 && { value: `${metrics.avg_delivery_rating.toFixed(1)} / 5`, label: 'Delivery' },
    metrics.avg_response_rating > 0 && { value: `${metrics.avg_response_rating.toFixed(1)} / 5`, label: 'Response' },
    metrics.customer_satisfaction_rating > 0 && { value: `${metrics.customer_satisfaction_rating.toFixed(1)} / 5`, label: 'Satisfaction' },
  ].filter(Boolean) as { value: string; label: string }[];

  if (!metrics.review_count || items.length === 0) return null;

  return (
    <Box>
       <Text textStyle="xs" color="fg.muted" fontWeight="semibold" mb={2} letterSpacing="wider">
        CUSTOMER FEEDBACK
      </Text>
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
      <SimpleGrid columns={items.length as 1 | 2 | 3} divideX="1px">
        {items.map(({ value, label }) => (
          <Box key={label} textAlign="center" py={3} px={2}>
            <Text textStyle="md" fontWeight="bold" color="primary.fg" lineHeight="1.2">{value}</Text>
            <Text textStyle="2xs" color="fg.muted" mt={0.5} fontWeight="medium">{label}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
    </Box>
  );
}
