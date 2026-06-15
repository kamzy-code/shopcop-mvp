import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { LuCheck, LuCircleAlert, LuCircleCheck } from 'react-icons/lu';
import { Order, OrderStatus } from '@/app/_types';
import { formatCurrency, formatDateTime } from '@/app/_lib/orderHelpers';

export const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
];

export const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Payment Confirmed',
  IN_PROGRESS: 'In Progress',
  READY_FOR_DISPATCH: 'Ready to Ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUND_REQUESTED: 'Refund Requested',
  REFUND_IN_PROGRESS: 'Refund In Progress',
  REFUNDED: 'Refunded',
  RESOLVED: 'Resolved',
};

export const REFUND_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  REFUND_REQUESTED:   'Refund Requested',
  REFUND_IN_PROGRESS: 'Refund In Progress',
  REFUNDED:           'Refund Issued',
  RESOLVED:           'Order Resolved',
  COMPLETED:          'Marked as Complete',
};

function TimelineIcon({ done, active }: { done?: boolean; active?: boolean }) {
  return (
    <Flex
      w={7}
      h={7}
      borderRadius="full"
      align="center"
      justify="center"
      bg={done ? 'primary.500' : active ? 'primary.subtle' : 'bg.subtle'}
      flexShrink={0}
      borderWidth="2px"
      borderColor={done ? 'primary.500' : active ? 'primary.300' : 'border'}
    >
      {done ? (
        <LuCheck size={12} color="white" />
      ) : (
        <Box w={2} h={2} borderRadius="full" bg={active ? 'primary.400' : 'border'} />
      )}
    </Flex>
  );
}

function TimelineEntry({
  label,
  ts,
  note,
  done,
  active,
  connector,
  connectorColor = 'primary.200',
}: {
  label: string;
  ts?: string | null;
  note?: string | null;
  done?: boolean;
  active?: boolean;
  connector?: boolean;
  connectorColor?: string;
}) {
  return (
    <Flex gap={3} align="flex-start">
      <Flex direction="column" align="center">
        <TimelineIcon done={done} active={active} />
        {connector && (
          <Box w="2px" flex={1} minH={6} bg={connectorColor} my={1} />
        )}
      </Flex>
      <Box pb={connector ? 2 : 0} pt={0.5}>
        <Text
          textStyle="sm"
          fontWeight={active ? 'semibold' : 'normal'}
          color={active ? 'fg' : done ? 'fg.muted' : 'fg.subtle'}
        >
          {label}
        </Text>
        {(done || active) && ts && (
          <Text textStyle="xs" color="fg.subtle">{formatDateTime(ts)}</Text>
        )}
        {(done || active) && note && (
          <Text textStyle="xs" color="fg.muted" mt={0.5} fontStyle="italic">
            {`"${note}"`}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

export function StatusTimeline({ tx }: { tx: Order }) {
  if (tx.status === 'CANCELLED') {
    return (
      <Box
        p={4} bg="red.subtle" borderRadius="xl"
        borderWidth="1px" borderColor="red.200" _dark={{ borderColor: 'red.800' }}
      >
        <Text textStyle="sm" fontWeight="semibold" color="red.700" _dark={{ color: 'red.300' }}>
          Order Cancelled
        </Text>
        {tx.cancellation_reason && (
          <Text textStyle="xs" color="red.600" _dark={{ color: 'red.400' }} mt={1}>
            Reason: {tx.cancellation_reason}
          </Text>
        )}
      </Box>
    );
  }

  if (tx.status === 'REFUND_REQUESTED' || tx.status === 'REFUND_IN_PROGRESS') {
    return (
      <Box
        p={4} bg="orange.subtle" borderRadius="xl"
        borderWidth="1px" borderColor="orange.200" _dark={{ borderColor: 'orange.800' }}
      >
        <Flex align="center" gap={2}>
          <LuCircleAlert size={15} color="var(--chakra-colors-orange-600)" />
          <Text textStyle="sm" fontWeight="semibold" color="orange.700" _dark={{ color: 'orange.300' }}>
            {STATUS_LABELS[tx.status]}
          </Text>
        </Flex>
        {tx.refund_reason && (
          <Text textStyle="xs" color="orange.600" _dark={{ color: 'orange.400' }} mt={1}>
            Reason: {tx.refund_reason}
          </Text>
        )}
      </Box>
    );
  }

  if (tx.status === 'REFUNDED' || tx.status === 'RESOLVED') {
    return (
      <Box
        p={4} bg="blue.subtle" borderRadius="xl"
        borderWidth="1px" borderColor="blue.200" _dark={{ borderColor: 'blue.800' }}
      >
        <Text textStyle="sm" fontWeight="semibold" color="blue.700" _dark={{ color: 'blue.300' }}>
          {tx.status === 'REFUNDED' ? 'Refund Issued' : 'Order Resolved'}
        </Text>
        {tx.refund_amount != null && (
          <Text textStyle="xs" color="blue.600" _dark={{ color: 'blue.400' }} mt={1}>
            Refund amount: {formatCurrency(tx.refund_amount)}
          </Text>
        )}
        {tx.refund_vendor_notes && (
          <Text textStyle="xs" color="blue.600" _dark={{ color: 'blue.400' }} mt={1}>
            {tx.refund_vendor_notes}
          </Text>
        )}
      </Box>
    );
  }

  if (tx.status === 'COMPLETED' && tx.refund_status !== 'NONE') {
    const deliverySteps = STATUS_ORDER.slice(0, STATUS_ORDER.indexOf('DELIVERED') + 1);
    const refundStatusSet = new Set(['REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'REFUNDED', 'RESOLVED']);
    const refundJourney = tx.status_history
      .filter(
        (h) =>
          refundStatusSet.has(h.to_status) ||
          (h.to_status === 'COMPLETED' && refundStatusSet.has(h.from_status ?? ''))
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return (
      <Stack gap={3}>
        <Stack gap={0}>
          {deliverySteps.map((status, i) => {
            const h = tx.status_history.find((e) => e.to_status === status);
            return (
              <TimelineEntry
                key={status}
                label={STATUS_LABELS[status] ?? status}
                ts={h?.created_at}
                note={h?.note}
                done
                connector={i < deliverySteps.length - 1}
              />
            );
          })}
        </Stack>

        <Flex align="center" gap={2} px={1}>
          <Box flex={1} h="1px" bg="border" />
          <Text textStyle="2xs" color="fg.subtle" fontWeight="medium">REFUND PROCESS</Text>
          <Box flex={1} h="1px" bg="border" />
        </Flex>

        <Stack gap={0}>
          {refundJourney.map((entry, i) => (
            <TimelineEntry
              key={i}
              label={REFUND_STATUS_LABELS[entry.to_status as OrderStatus] ?? entry.to_status}
              ts={entry.created_at}
              note={entry.note}
              done
              connector={i < refundJourney.length - 1}
              connectorColor="blue.200"
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(tx.status);
  return (
    <Stack gap={0}>
      {STATUS_ORDER.map((status, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const h = tx.status_history.find((e) => e.to_status === status);
        const connector = i < STATUS_ORDER.length - 1;
        return (
          <TimelineEntry
            key={status}
            label={STATUS_LABELS[status] ?? status}
            ts={h?.created_at}
            note={h?.note}
            done={done}
            active={active}
            connector={connector}
            connectorColor={done ? 'primary.200' : 'border'}
          />
        );
      })}
    </Stack>
  );
}
