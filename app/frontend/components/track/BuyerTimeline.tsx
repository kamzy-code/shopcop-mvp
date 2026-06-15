'use client';
import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { LuCircleAlert, LuCircleCheck, LuClock, LuPackage, LuTruck } from 'react-icons/lu';
import { OrderStatus, OrderStatusHistoryEntry } from '@/app/_types';
import { formatDateTime } from '@/app/_lib/orderHelpers';

export const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
];

const DELIVERY_STEPS = STATUS_ORDER.slice(0, STATUS_ORDER.indexOf('DELIVERED') + 1);

export const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Payment Confirmed',
  IN_PROGRESS: 'Being Prepared',
  READY_FOR_DISPATCH: 'Ready to Ship',
  SHIPPED: 'On Its Way',
  DELIVERED: 'Delivered',
  COMPLETED: 'Order Complete',
};

export const STATUS_ICONS: Partial<Record<OrderStatus, React.ElementType>> = {
  PENDING: LuClock,
  CONFIRMED: LuCircleCheck,
  IN_PROGRESS: LuPackage,
  READY_FOR_DISPATCH: LuPackage,
  SHIPPED: LuTruck,
  DELIVERED: LuCircleCheck,
  COMPLETED: LuCircleCheck,
};

const REFUND_STATUS_SET = new Set([
  'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS',
  'REFUNDED',
  'RESOLVED',
]);

const REFUND_STEP_LABELS: Record<string, string> = {
  REFUND_REQUESTED: 'Refund Requested',
  REFUND_IN_PROGRESS: 'Refund In Progress',
  REFUNDED: 'Refund Issued',
  RESOLVED: 'Order Resolved',
  COMPLETED: 'Order Closed',
};

export function BuyerTimeline({
  status,
  statusHistory = [],
}: {
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryEntry[];
}) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isRefundPath =
    REFUND_STATUS_SET.has(status) ||
    (status === 'COMPLETED' &&
      statusHistory.some((h) => REFUND_STATUS_SET.has(h.to_status)));

  if (status === 'CANCELLED') {
    return (
      <Box p={4} bg="red.subtle" borderRadius="xl" borderWidth="1px" borderColor="red.200" _dark={{ borderColor: 'red.800' }}>
        <Flex align="center" gap={2} mb={1}>
          <LuCircleAlert size={16} color="var(--chakra-colors-red-600)" />
          <Text textStyle="sm" fontWeight="semibold" color="red.700" _dark={{ color: 'red.300' }}>
            Order Cancelled
          </Text>
        </Flex>
        <Text textStyle="sm" color="red.600" _dark={{ color: 'red.400' }}>
          This order was cancelled. If you believe this is a mistake, contact the seller directly.
        </Text>
      </Box>
    );
  }

  if (isRefundPath) {
    const refundJourney = statusHistory
      .filter(
        (h) =>
          REFUND_STATUS_SET.has(h.to_status) ||
          (h.to_status === 'COMPLETED' && REFUND_STATUS_SET.has(h.from_status ?? ''))
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
      <Stack gap={3}>
        <Stack gap={0}>
          {DELIVERY_STEPS.map((s, i) => {
            const Icon = STATUS_ICONS[s] ?? LuClock;
            const h = statusHistory.find((e) => e.to_status === s);
            const isLast = i === DELIVERY_STEPS.length - 1;
            return (
              <Flex key={s} gap={3} align="flex-start">
                <Flex direction="column" align="center">
                  <Flex w={9} h={9} borderRadius="full" align="center" justify="center"
                    bg="primary.500" borderWidth="2px" borderColor="primary.500" flexShrink={0}
                  >
                    <Icon size={16} color="white" />
                  </Flex>
                  {!isLast && <Box w="2px" flex={1} minH={6} bg="primary.200" my={1} />}
                </Flex>
                <Box pb={isLast ? 0 : 3} pt={1.5}>
                  <Text textStyle="sm" color="fg.muted">{STATUS_LABELS[s] ?? s}</Text>
                  {h && <Text textStyle="xs" color="fg.subtle">{formatDateTime(h.created_at)}</Text>}
                </Box>
              </Flex>
            );
          })}
        </Stack>

        <Flex align="center" gap={2} px={1}>
          <Box flex={1} h="1px" bg="border" />
          <Text textStyle="2xs" color="fg.subtle" fontWeight="medium" letterSpacing="wider">
            REFUND PROCESS
          </Text>
          <Box flex={1} h="1px" bg="border" />
        </Flex>

        {refundJourney.length > 0 ? (
          <Stack gap={0}>
            {refundJourney.map((entry, i) => {
              const isLast = i === refundJourney.length - 1;
              const isActive = isLast && REFUND_STATUS_SET.has(status);
              return (
                <Flex key={i} gap={3} align="flex-start">
                  <Flex direction="column" align="center">
                    <Flex
                      w={9} h={9} borderRadius="full" align="center" justify="center"
                      bg={isActive ? 'orange.subtle' : 'primary.500'}
                      borderWidth="2px"
                      borderColor={isActive ? 'orange.300' : 'primary.500'}
                      flexShrink={0}
                    >
                      <LuCircleCheck
                        size={16}
                        color={isActive ? 'var(--chakra-colors-orange-600)' : 'white'}
                      />
                    </Flex>
                    {!isLast && <Box w="2px" flex={1} minH={6} bg="primary.200" my={1} />}
                  </Flex>
                  <Box pb={isLast ? 0 : 3} pt={1.5}>
                    <Text
                      textStyle="sm"
                      fontWeight={isActive ? 'semibold' : 'normal'}
                      color={isActive ? 'fg' : 'fg.muted'}
                    >
                      {REFUND_STEP_LABELS[entry.to_status] ?? entry.to_status}
                    </Text>
                    <Text textStyle="xs" color="fg.subtle">
                      {formatDateTime(entry.created_at)}
                    </Text>
                    {entry.note && (
                      <Text textStyle="xs" color="fg.muted" mt={0.5} fontStyle="italic">
                        {`"${entry.note}"`}
                      </Text>
                    )}
                    {isActive && (
                      <Text textStyle="xs" color="orange.600" _dark={{ color: 'orange.300' }} fontWeight="medium">
                        {status === 'REFUND_REQUESTED'
                          ? 'Awaiting seller review'
                          : status === 'REFUND_IN_PROGRESS'
                            ? 'Being processed'
                            : status === 'REFUNDED'
                              ? 'Allow 2–5 business days'
                              : 'Awaiting your acknowledgment'}
                      </Text>
                    )}
                  </Box>
                </Flex>
              );
            })}
          </Stack>
        ) : (
          <Box p={3} bg="orange.subtle" borderRadius="lg" borderWidth="1px" borderColor="orange.200">
            <Text textStyle="xs" color="orange.700" _dark={{ color: 'orange.300' }}>
              Your refund request has been received. The seller is reviewing it.
            </Text>
          </Box>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      {STATUS_ORDER.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const Icon = STATUS_ICONS[s] ?? LuClock;
        const isLast = i === STATUS_ORDER.length - 1;
        const historyEntry = statusHistory.find((h) => h.to_status === s);

        return (
          <Flex key={s} gap={3} align="flex-start">
            <Flex direction="column" align="center">
              <Flex
                w={9}
                h={9}
                borderRadius="full"
                align="center"
                justify="center"
                bg={done ? 'primary.500' : active ? 'primary.subtle' : 'bg.subtle'}
                borderWidth="2px"
                borderColor={done ? 'primary.500' : active ? 'primary.300' : 'border'}
                flexShrink={0}
              >
                <Icon
                  size={16}
                  color={
                    done
                      ? 'white'
                      : active
                        ? 'var(--chakra-colors-primary-fg)'
                        : 'var(--chakra-colors-fg-subtle)'
                  }
                />
              </Flex>
              {!isLast && (
                <Box w="2px" flex={1} minH={6} bg={done ? 'primary.200' : 'border'} my={1} />
              )}
            </Flex>
            <Box pb={isLast ? 0 : 3} pt={1.5}>
              <Text
                textStyle="sm"
                fontWeight={active ? 'semibold' : 'normal'}
                color={active ? 'fg' : done ? 'fg.muted' : 'fg.subtle'}
              >
                {STATUS_LABELS[s] ?? s}
              </Text>
              {(done || active) && historyEntry && (
                <Text textStyle="xs" color="fg.subtle">
                  {formatDateTime(historyEntry.created_at)}
                </Text>
              )}
              {(done || active) && historyEntry?.note && (
                <Text textStyle="xs" color="fg.muted" mt={0.5} fontStyle="italic">
                  {`"${historyEntry.note}"`}
                </Text>
              )}
              {active && !historyEntry && (
                <Text textStyle="xs" color="primary.fg" fontWeight="medium">
                  Current status
                </Text>
              )}
            </Box>
          </Flex>
        );
      })}
    </Stack>
  );
}
