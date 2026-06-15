'use client';
import { useState } from 'react';
import { Box, Button, Flex, Grid, Stack, Text } from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import { LuClock } from 'react-icons/lu';
import { AlertModal } from '@/components/ui/alert-modal';
import { toaster } from '@/components/ui/toaster';
import {
  useOrder,
  useUpdateOrderStatus,
  useUpdateOrderStatusWithRefund,
  useConfirmPayment,
  useCancelOrder,
} from '@/app/_hooks/order';
import { Order, OrderItem, OrderStatus } from '@/app/_types';
import { ReviewStars as ReviewStarsVendor } from '@/components/review/ReviewStars';
import { ItemDetailModal } from '@/components/order/ItemDetailModal';
import { formatCurrency, formatDate, formatDateTime } from '@/app/_lib/orderHelpers';
import { OrderHeader } from '@/components/order/OrderHeader';
import { OrderCancelModal } from '@/components/order/OrderCancelModal';
import { StatusUpdateModal } from '@/components/order/OrderRefundModal';
import { OrderPaymentPanel } from '@/components/order/OrderPaymentPanel';
import { OrderItemsTable } from '@/components/order/OrderItemsTable';
import { StatusTimeline } from '@/components/order/OrderTimeline';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    label: string;
    next: OrderStatus;
  } | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundVendorNotes, setRefundVendorNotes] = useState('');
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  const { data: tx, isLoading, error } = useOrder(id);
  const statusMutation = useUpdateOrderStatus();
  const refundStatusMutation = useUpdateOrderStatusWithRefund();
  const paymentMutation = useConfirmPayment();
  const cancelMutation = useCancelOrder();

  const isRefundAction = pendingStatusAction?.next === 'REFUND_REQUESTED';

  const copyTrackingLink = () => {
    if (!tx) return;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${base}/track/${tx.tracking_token}`);
    toaster.create({ title: 'Tracking link copied!', type: 'info' });
  };

  const handleStatusUpdate = async (next: OrderStatus, note?: string) => {
    try {
      if (next === 'REFUND_REQUESTED') {
        await refundStatusMutation.mutateAsync({
          id,
          status: next,
          note,
          refund_amount: refundAmount ? Number(refundAmount) : undefined,
          refund_vendor_notes: refundVendorNotes || undefined,
        });
      } else {
        await statusMutation.mutateAsync({ id, status: next, note });
      }
      setPendingStatusAction(null);
      setStatusUpdateNote('');
      setRefundAmount('');
      setRefundVendorNotes('');
      toaster.create({ title: 'Status updated', type: 'success' });
    } catch (err) {
      setErrorModal({
        open: true,
        title: 'Failed to update status',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleConfirmPayment = async (notes?: string) => {
    try {
      await paymentMutation.mutateAsync({ id, payment_notes: notes });
      setShowPaymentModal(false);
      toaster.create({ title: 'Payment confirmed', type: 'success' });
    } catch (err) {
      setShowPaymentModal(false);
      setErrorModal({
        open: true,
        title: 'Failed to confirm payment',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      await cancelMutation.mutateAsync({ id, reason });
      setShowCancelModal(false);
      toaster.create({ title: 'Order cancelled', type: 'success' });
    } catch (err) {
      setShowCancelModal(false);
      setErrorModal({
        open: true,
        title: 'Failed to cancel order',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      
        <Stack gap={6}>
          <Flex align="center" gap={3}>
            <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
            <Box w="160px" h={6} bg="bg.subtle" borderRadius="md" />
          </Flex>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={6}>
            <Stack gap={6}>
              <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
                <Box w="120px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
                <Stack gap={3}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Flex key={i} align="center" gap={4} p={3} bg="bg.subtle" borderRadius="lg">
                      <Box w={12} h={12} borderRadius="md" bg="bg.panel" />
                      <Box flex={1}>
                        <Box w="50%" h={3} bg="bg.panel" borderRadius="md" mb={1.5} />
                        <Box w="30%" h={3} bg="bg.panel" borderRadius="md" />
                      </Box>
                      <Box w="70px" h={4} bg="bg.panel" borderRadius="md" />
                    </Flex>
                  ))}
                </Stack>
              </Box>
            </Stack>
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Box w="100px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
              <Stack gap={4}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Flex key={i} gap={3}>
                    <Box w={6} h={6} borderRadius="full" bg="bg.subtle" />
                    <Box flex={1}>
                      <Box w="80%" h={3} bg="bg.subtle" borderRadius="md" mb={1.5} />
                      <Box w="50%" h={2.5} bg="bg.subtle" borderRadius="md" />
                    </Box>
                  </Flex>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Stack>
      
    );
  }

  if (error || !tx) {
    return (
      
        <Box textAlign="center" py={16}>
          <Text color="fg.muted">Order not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </Box>
      
    );
  }

  return (
    <>
      <OrderCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
      <StatusUpdateModal
        open={!!pendingStatusAction}
        onClose={() => {
          setPendingStatusAction(null);
          setStatusUpdateNote('');
          setRefundAmount('');
          setRefundVendorNotes('');
        }}
        onConfirm={() =>
          pendingStatusAction &&
          handleStatusUpdate(pendingStatusAction.next, statusUpdateNote || undefined)
        }
        actionLabel={pendingStatusAction?.label ?? ''}
        isLoading={statusMutation.isPending || refundStatusMutation.isPending}
        note={statusUpdateNote}
        onNoteChange={setStatusUpdateNote}
        refundAmount={refundAmount}
        onRefundAmountChange={setRefundAmount}
        refundVendorNotes={refundVendorNotes}
        onRefundVendorNotesChange={setRefundVendorNotes}
        showRefundFields={isRefundAction}
      />
      <ItemDetailModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem!}
      />
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />

      <Box maxW="720px" mx="auto">
        <OrderHeader
          tx={tx}
          id={id}
          onBack={() => router.push('/orders')}
          onEdit={() => router.push(`/orders/${id}/edit`)}
          onCopyTrackingLink={copyTrackingLink}
          onOpenPaymentModal={() => setShowPaymentModal(true)}
          onOpenCancelModal={() => setShowCancelModal(true)}
          onStatusAction={(label, next) => setPendingStatusAction({ label, next })}
        />

        <Stack gap={4} mt={6}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              ORDER INFO
            </Text>
            <Stack gap={2}>
              {tx.buyer_email && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Buyer Email
                  </Text>
                  <Text textStyle="sm" color="fg">
                    {tx.buyer_email}
                  </Text>
                </Flex>
              )}
              <Flex justify="space-between">
                <Text textStyle="sm" color="fg.muted">
                  Delivery
                </Text>
                <Text textStyle="sm" color="fg">
                  {tx.delivery_method === 'PICKUP'
                    ? 'Pickup'
                    : tx.delivery_method === 'DISPATCH'
                      ? 'Dispatch'
                      : 'Waybill'}
                </Text>
              </Flex>
              {(tx.expected_delivery_start || tx.expected_delivery_end) && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Expected
                  </Text>
                  <Text textStyle="sm" color="fg">
                    {formatDate(tx.expected_delivery_start)} –{' '}
                    {formatDate(tx.expected_delivery_end)}
                  </Text>
                </Flex>
              )}
            </Stack>
          </Box>

          <OrderItemsTable tx={tx} onItemClick={setSelectedItem} />

          <OrderPaymentPanel
            tx={tx}
            showPaymentModal={showPaymentModal}
            onClosePaymentModal={() => setShowPaymentModal(false)}
            onConfirmPayment={handleConfirmPayment}
            isConfirmingPayment={paymentMutation.isPending}
            showReceiptModal={showReceiptModal}
            onOpenReceiptModal={() => setShowReceiptModal(true)}
            onCloseReceiptModal={() => setShowReceiptModal(false)}
          />

          {tx.refund_status !== 'NONE' && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
                REFUND INFO
              </Text>
              <Stack gap={2}>
                {tx.refund_reason && (
                  <Flex justify="space-between" align="flex-start" gap={4}>
                    <Text textStyle="sm" color="fg.muted" flexShrink={0}>
                      Reason
                    </Text>
                    <Text textStyle="sm" textAlign="right">
                      {tx.refund_reason}
                    </Text>
                  </Flex>
                )}
                {tx.refund_amount != null && (
                  <Flex justify="space-between">
                    <Text textStyle="sm" color="fg.muted">
                      Amount
                    </Text>
                    <Text textStyle="sm" fontWeight="medium">
                      {formatCurrency(tx.refund_amount)}
                    </Text>
                  </Flex>
                )}
                {tx.refund_vendor_notes && (
                  <Flex justify="space-between" align="flex-start" gap={4}>
                    <Text textStyle="sm" color="fg.muted" flexShrink={0}>
                      Internal notes
                    </Text>
                    <Text textStyle="sm" textAlign="right" color="fg.muted">
                      {tx.refund_vendor_notes}
                    </Text>
                  </Flex>
                )}
              </Stack>
            </Box>
          )}

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
              STATUS HISTORY
            </Text>
            <StatusTimeline tx={tx} />
          </Box>

          {tx.review && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
                BUYER REVIEW
              </Text>
              <Flex align="center" gap={3} mb={tx.review.review_text ? 2 : 0}>
                <ReviewStarsVendor rating={tx.review.overall_rating} />
                {tx.review.buyer_name ? (
                  <Text textStyle="sm" color="fg.muted">
                    {tx.review.buyer_name}
                  </Text>
                ) : (
                  <Text textStyle="sm" color="fg.subtle" fontStyle="italic">
                    Anonymous
                  </Text>
                )}
                <Text textStyle="xs" color="fg.subtle" ml="auto">
                  {new Date(tx.review.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </Flex>
              {tx.review.review_text && (
                <Text textStyle="sm" color="fg.muted" mt={1}>
                  {tx.review.review_text}
                </Text>
              )}
            </Box>
          )}

          {(tx.order_notes || tx.vendor_notes) && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
                NOTES
              </Text>
              <Stack gap={3}>
                {tx.order_notes && (
                  <Box>
                    <Flex align="center" gap={1.5} mb={1}>
                      <LuClock size={12} />
                      <Text textStyle="xs" color="fg.muted">
                        Order notes (visible to buyer)
                      </Text>
                    </Flex>
                    <Text textStyle="sm" color="fg">
                      {tx.order_notes}
                    </Text>
                  </Box>
                )}
                {tx.vendor_notes && (
                  <Box>
                    <Text textStyle="xs" color="fg.muted" mb={1}>
                      Vendor notes (internal)
                    </Text>
                    <Text textStyle="sm" color="fg">
                      {tx.vendor_notes}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>
    </>
  );
}
