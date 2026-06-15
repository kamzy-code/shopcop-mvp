'use client';
import { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuCircleCheck, LuShoppingCart } from 'react-icons/lu';
import { formatCurrency } from '@/app/_lib/orderHelpers';
import {
  useBuyerCancelOrder,
  useBuyerCloseResolution,
  useBuyerConfirmDelivery,
  useBuyerRequestRefund,
} from '@/app/_hooks/order';
import { Order } from '@/app/_types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toaster } from '@/components/ui/toaster';

export function BuyerActions({ token, tx }: { token: string; tx: Order }) {
  const router = useRouter();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const cancelMutation = useBuyerCancelOrder(token);
  const closeResolutionMutation = useBuyerCloseResolution(token);
  const confirmDeliveryMutation = useBuyerConfirmDelivery(token);
  const refundRequestMutation = useBuyerRequestRefund(token);

  const vendor = tx.vendor as { refund_policy_type?: string | null; refund_duration_days?: number | null };

  const isUnpaid = tx.payment_status === 'UNPAID';
  const isCancelled = tx.status === 'CANCELLED';
  const isPending = tx.status === 'PENDING';
  const isDelivered = tx.status === 'DELIVERED';
  const isAwaitingClose = tx.status === 'REFUNDED' || tx.status === 'RESOLVED';

  const refundWindowStart = tx.completed_at ?? tx.delivered_at;
  const refundCutoffMs = (vendor?.refund_duration_days ?? 0) * 24 * 60 * 60 * 1000;
  const isWithinRefundWindow =
    vendor?.refund_duration_days == null ||
    !refundWindowStart ||
    Date.now() - new Date(refundWindowStart).getTime() <= refundCutoffMs;

  const isRefundable =
    (tx.status === 'DELIVERED' || tx.status === 'COMPLETED') &&
    vendor?.refund_policy_type !== 'NO_REFUNDS' &&
    isWithinRefundWindow;

  const handleBuyerCancel = async () => {
    try {
      await cancelMutation.mutateAsync({ reason: cancelReason });
      setShowCancelConfirm(false);
      setCancelReason('');
      toaster.create({ title: 'Order cancelled', type: 'success' });
    } catch {
      toaster.create({ title: 'Failed to cancel order', type: 'error' });
    }
  };

  const handleBuyerConfirmDelivery = async () => {
    try {
      await confirmDeliveryMutation.mutateAsync();
      setShowDeliveryConfirm(false);
      toaster.create({ title: 'Delivery confirmed!', type: 'success' });
    } catch {
      toaster.create({ title: 'Failed to confirm delivery', type: 'error' });
    }
  };

  const handleBuyerRequestRefund = async () => {
    try {
      await refundRequestMutation.mutateAsync({ reason: refundReason });
      setShowRefundModal(false);
      setRefundReason('');
      toaster.create({ title: 'Refund requested', type: 'success' });
    } catch {
      toaster.create({ title: 'Failed to request refund', type: 'error' });
    }
  };

  return (
    <>
      {isUnpaid && !isCancelled && (
        <Box bg="primary.subtle" borderRadius="xl" borderWidth="1px" borderColor="primary.200" p={5}>
          <Flex align="center" gap={3} mb={3}>
            <Flex w={10} h={10} borderRadius="full" bg="primary.500" align="center" justify="center" flexShrink={0}>
              <LuShoppingCart size={18} color="white" />
            </Flex>
            <Box>
              <Text textStyle="md" fontWeight="semibold" color="fg">
                Payment required
              </Text>
              <Text textStyle="sm" color="fg.muted">
                Send payment to confirm your order
              </Text>
            </Box>
          </Flex>
          <Button colorPalette="primary" w="full" onClick={() => router.push(`/track/${token}/checkout`)}>
            Complete Checkout
          </Button>
        </Box>
      )}

      {isPending && (
        <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
          <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">
            ACTIONS
          </Text>
          <Button w="full" variant="outline" colorPalette="red" size="sm" onClick={() => setShowCancelConfirm(true)}>
            Cancel Order
          </Button>
        </Box>
      )}

      {isDelivered && (
        <Box p={4} bg="green.subtle" borderRadius="xl" borderWidth="1px" borderColor="green.200" _dark={{ borderColor: 'green.800' }}>
          <Flex align="center" gap={2} mb={3}>
            <Box color="green.600" _dark={{ color: 'green.400' }} display="flex" alignItems="center">
              <LuCircleCheck size={18} />
            </Box>
            <Box>
              <Text textStyle="sm" fontWeight="semibold" color="green.700" _dark={{ color: 'green.300' }}>
                Package Delivered
              </Text>
              <Text textStyle="xs" color="green.600" _dark={{ color: 'green.400' }}>
                Received your order? Confirm to complete.
              </Text>
            </Box>
          </Flex>
          <Button
            w="full"
            colorPalette="green"
            size="sm"
            onClick={() => setShowDeliveryConfirm(true)}
            loading={confirmDeliveryMutation.isPending}
          >
            Yes, I Received It
          </Button>
        </Box>
      )}

      {isAwaitingClose && (
        <Box p={4} bg="teal.subtle" borderRadius="xl" borderWidth="1px" borderColor="teal.200" _dark={{ borderColor: 'teal.800' }}>
          <Flex align="center" gap={2} mb={3}>
            <Box color="teal.600" _dark={{ color: 'teal.400' }} display="flex" alignItems="center">
              <LuCircleCheck size={18} />
            </Box>
            <Box>
              <Text textStyle="sm" fontWeight="semibold" color="teal.700" _dark={{ color: 'teal.300' }}>
                {tx.status === 'REFUNDED' ? 'Refund Processed' : 'Order Resolved'}
              </Text>
              <Text textStyle="xs" color="teal.600" _dark={{ color: 'teal.400' }}>
                {tx.status === 'REFUNDED'
                  ? `Your refund${tx.refund_amount != null ? ` of ${formatCurrency(tx.refund_amount)}` : ''} has been processed. Allow 2–5 business days.`
                  : 'This order has been resolved. Contact the seller if you need further assistance.'}
              </Text>
            </Box>
          </Flex>
          <Button w="full" colorPalette="teal" size="sm" onClick={() => setShowCloseConfirm(true)} loading={closeResolutionMutation.isPending}>
            {tx.status === 'REFUNDED' ? "I've received my refund — close this order" : 'Understood — close this order'}
          </Button>
        </Box>
      )}

      {isRefundable && (
        <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
          <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">
            NEED HELP?
          </Text>
          <Button w="full" variant="outline" colorPalette="orange" size="sm" onClick={() => setShowRefundModal(true)}>
            Request Refund
          </Button>
        </Box>
      )}

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => { setShowCancelConfirm(false); setCancelReason(''); }}
        onConfirm={handleBuyerCancel}
        title="Cancel Order"
        description="Are you sure you want to cancel this order?"
        confirmLabel="Cancel Order"
        colorPalette="red"
        isLoading={cancelMutation.isPending}
        confirmDisabled={cancelReason.trim().length < 10}
      >
        <Box mt={3}>
          <Text textStyle="xs" color="fg.muted" mb={1}>
            Reason (required, min 10 characters)
          </Text>
          <textarea
            placeholder="Why are you cancelling?"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--chakra-colors-border)',
              background: 'transparent',
              fontSize: '14px',
              color: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          {cancelReason.length > 0 && cancelReason.trim().length < 10 && (
            <Text textStyle="2xs" color="red.500" mt={1}>
              At least 10 characters required
            </Text>
          )}
        </Box>
      </ConfirmDialog>

      <ConfirmDialog
        open={showDeliveryConfirm}
        onClose={() => setShowDeliveryConfirm(false)}
        onConfirm={handleBuyerConfirmDelivery}
        title="Confirm Delivery"
        description="By confirming, you acknowledge that you have received your order. This will mark the order as complete."
        confirmLabel="Yes, I Received It"
        colorPalette="green"
        isLoading={confirmDeliveryMutation.isPending}
      />

      <ConfirmDialog
        open={showRefundModal}
        onClose={() => { setShowRefundModal(false); setRefundReason(''); }}
        onConfirm={handleBuyerRequestRefund}
        title="Request Refund"
        description="Please explain why you are requesting a refund."
        confirmLabel="Submit Refund Request"
        colorPalette="orange"
        isLoading={refundRequestMutation.isPending}
        confirmDisabled={refundReason.trim().length < 10}
      >
        <Box mt={3}>
          <Text textStyle="xs" color="fg.muted" mb={1}>
            Reason (required, min 10 characters)
          </Text>
          <textarea
            placeholder="Why are you requesting a refund?"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--chakra-colors-border)',
              background: 'transparent',
              fontSize: '14px',
              color: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
          {refundReason.length > 0 && refundReason.trim().length < 10 && (
            <Text textStyle="2xs" color="red.500" mt={1}>
              At least 10 characters required
            </Text>
          )}
        </Box>
      </ConfirmDialog>

      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={async () => {
          try {
            await closeResolutionMutation.mutateAsync();
            setShowCloseConfirm(false);
            toaster.create({ title: 'Order closed', type: 'success' });
          } catch {
            toaster.create({ title: 'Failed to close order', type: 'error' });
          }
        }}
        title="Close this order?"
        description={
          tx.status === 'REFUNDED'
            ? "Confirm that you've received your refund. This will close the order."
            : "Confirm that this order has been resolved to your satisfaction. This will close the order."
        }
        confirmLabel="Yes, close order"
        colorPalette="teal"
        isLoading={closeResolutionMutation.isPending}
      />
    </>
  );
}
