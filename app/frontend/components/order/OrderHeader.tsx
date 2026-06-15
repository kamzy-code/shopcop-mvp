import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LuArrowLeft, LuCircleCheck, LuCopy, LuPencil, LuTruck, LuX } from 'react-icons/lu';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { Order, OrderStatus } from '@/app/_types';
import { formatDateTime } from '@/app/_lib/orderHelpers';

export const NEXT_STATUS_ACTION: Partial<
  Record<
    OrderStatus,
    {
      label: string;
      next: OrderStatus;
      secondaryLabel?: string;
      secondaryNext?: OrderStatus;
    }
  >
> = {
  CONFIRMED: { label: 'Mark In Progress', next: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Mark Ready for Dispatch', next: 'READY_FOR_DISPATCH' },
  READY_FOR_DISPATCH: { label: 'Mark Shipped', next: 'SHIPPED' },
  SHIPPED: { label: 'Mark Delivered', next: 'DELIVERED' },
  DELIVERED: {
    label: 'Initiate Refund',
    next: 'REFUND_REQUESTED',
  },
  REFUND_REQUESTED: {
    label: 'Begin Refund Process',
    next: 'REFUND_IN_PROGRESS',
    secondaryLabel: 'Resolve Directly',
    secondaryNext: 'RESOLVED',
  },
  REFUND_IN_PROGRESS: {
    label: 'Mark Refunded',
    next: 'REFUNDED',
    secondaryLabel: 'Mark Resolved',
    secondaryNext: 'RESOLVED',
  },
};

export const CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
];

export const REFUND_NEXT_STATUSES: OrderStatus[] = [
  'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS',
  'REFUNDED',
  'RESOLVED',
];

export function OrderHeader({
  tx,
  id,
  onBack,
  onEdit,
  onCopyTrackingLink,
  onOpenPaymentModal,
  onOpenCancelModal,
  onStatusAction,
}: {
  tx: Order;
  id: string;
  onBack: () => void;
  onEdit: () => void;
  onCopyTrackingLink: () => void;
  onOpenPaymentModal: () => void;
  onOpenCancelModal: () => void;
  onStatusAction: (label: string, next: OrderStatus) => void;
}) {
  const nextAction = NEXT_STATUS_ACTION[tx.status];
  const canCancel = CANCELLABLE.includes(tx.status);
  const isPending = tx.status === 'PENDING';
  const allowRefund = tx.vendor?.refund_policy_type !== 'NO_REFUNDS';

  return (
    <>
      <Flex align="flex-start" gap={3} mb={6} flexWrap="wrap">
        <Button
          variant="ghost"
          size="sm"
          colorPalette="gray"
          onClick={onBack}
        >
          <LuArrowLeft />
        </Button>
        <Box flex={1}>
          <Text textStyle="2xs" color="fg.subtle" fontWeight="medium" mb={0.5}>
            ORDER ID
          </Text>
          <Flex align="center" gap={2} flexWrap="wrap" mb={1}>
            <Heading textStyle="xl" fontWeight="bold" color="fg">
              {tx.reference}
            </Heading>
            <OrderStatusBadge status={tx.status} />
          </Flex>
          <Text textStyle="xs" color="fg.muted">
            {formatDateTime(tx.created_at)}
          </Text>
        </Box>
        {isPending && (
          <Button
            variant="outline"
            size="sm"
            colorPalette="gray"
            onClick={onEdit}
          >
            <LuPencil size={14} />
            Edit
          </Button>
        )}
        <Button variant="outline" size="sm" colorPalette="gray" onClick={onCopyTrackingLink}>
          <LuCopy size={14} />
          Copy Link
        </Button>
      </Flex>

      {(isPending || nextAction || canCancel) && (
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
            ACTIONS
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {isPending && (
              <Button
                colorPalette="primary"
                size="sm"
                onClick={onOpenPaymentModal}
                disabled={tx.payment_status === 'UNPAID'}
              >
                <LuCircleCheck size={14} />
                Confirm Payment
              </Button>
            )}
            {nextAction && !isPending && (allowRefund || !REFUND_NEXT_STATUSES.includes(nextAction.next)) && (
              <Button
                colorPalette="primary"
                size="sm"
                onClick={() => onStatusAction(nextAction.label, nextAction.next)}
              >
                <LuTruck size={14} />
                {nextAction.label}
              </Button>
            )}
            {nextAction?.secondaryNext && !isPending && (allowRefund || !REFUND_NEXT_STATUSES.includes(nextAction.secondaryNext)) && (
              <Button
                variant="outline"
                colorPalette="primary"
                size="sm"
                onClick={() =>
                  onStatusAction(nextAction.secondaryLabel!, nextAction.secondaryNext!)
                }
              >
                {nextAction.secondaryLabel}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                colorPalette="red"
                size="sm"
                onClick={onOpenCancelModal}
              >
                <LuX size={14} />
                Cancel
              </Button>
            )}
          </Flex>
        </Box>
      )}
    </>
  );
}
