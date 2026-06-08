'use client';
import { useState } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import {
  LuArrowLeft,
  LuCheck,
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuCopy,
  LuPackage,
  LuPencil,
  LuTruck,
  LuX,
} from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
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
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  isVideoUrl,
} from '@/app/_lib/orderHelpers';

// ─── Payment status badge config ──────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; darkColor: string }
> = {
  UNPAID:          { label: 'Unpaid',          bg: 'gray.subtle',   color: 'gray.600',   darkColor: 'gray.300'   },
  PROOF_SUBMITTED: { label: 'Proof Submitted', bg: 'orange.subtle', color: 'orange.700', darkColor: 'orange.300' },
  PAID:            { label: 'Paid',            bg: 'green.subtle',  color: 'green.700',  darkColor: 'green.300'  },
  REFUNDED:        { label: 'Refunded',        bg: 'blue.subtle',   color: 'blue.700',   darkColor: 'blue.300'   },
};

// ─── Vendor-allowed status transitions ────────────────────────────────────────

const NEXT_STATUS_ACTION: Partial<
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
  // COMPLETED is removed from vendor actions — only buyers can complete a
  // order via "I've Received It" or via the 48-hour auto-close.
  DELIVERED: {
    label: 'Initiate Refund',
    next: 'REFUND_REQUESTED',
  },
  // REFUNDED and RESOLVED no longer have a vendor action — the system auto-closes.
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

const CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
];

const REFUND_NEXT_STATUSES: OrderStatus[] = [
  'REFUND_REQUESTED',
  'REFUND_IN_PROGRESS',
  'REFUNDED',
  'RESOLVED',
];

// ─── Timeline icon ─────────────────────────────────────────────────────────────

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

// ─── Status timeline ──────────────────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
];

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
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

const REFUND_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  REFUND_REQUESTED:   'Refund Requested',
  REFUND_IN_PROGRESS: 'Refund In Progress',
  REFUNDED:           'Refund Issued',
  RESOLVED:           'Order Resolved',
  COMPLETED:          'Marked as Complete',
};

function StatusTimeline({ tx }: { tx: Order }) {
  // ── Cancelled ──────────────────────────────────────────────────────────────
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

  // ── Active refund in progress ──────────────────────────────────────────────
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

  // ── Refund issued / resolved (awaiting vendor to mark complete) ────────────
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

  // ── Completed after a refund — two-part timeline ───────────────────────────
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
        {/* Delivery journey — all done */}
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

        {/* Divider */}
        <Flex align="center" gap={2} px={1}>
          <Box flex={1} h="1px" bg="border" />
          <Text textStyle="2xs" color="fg.subtle" fontWeight="medium">REFUND PROCESS</Text>
          <Box flex={1} h="1px" bg="border" />
        </Flex>

        {/* Refund journey */}
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

  // ── Normal in-progress / completed timeline ────────────────────────────────
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

// ─── Payment confirmation modal ────────────────────────────────────────────────

function PaymentConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => onConfirm(notes || undefined)}
      title="Confirm Payment"
      description="Confirming payment will mark this order as CONFIRMED and deduct stock from your catalog for linked products. This cannot be undone."
      confirmLabel="Confirm Payment"
      colorPalette="primary"
      isLoading={isLoading}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Payment notes (optional)
        </Text>
        <Textarea
          size="sm"
          rows={2}
          placeholder="e.g. Paid via transfer, ref #..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Box>
    </ConfirmDialog>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => {
        if (isValid) onConfirm(reason);
      }}
      title="Cancel Order"
      description="This will cancel the order and restore any deducted stock."
      confirmLabel="Cancel Order"
      colorPalette="red"
      isLoading={isLoading}
      confirmDisabled={!isValid}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Reason (required, min 10 characters)
        </Text>
        <Textarea
          size="sm"
          rows={3}
          placeholder="Why is this order being cancelled?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {reason.length > 0 && !isValid && (
          <Text textStyle="2xs" color="red.500" mt={1}>
            At least 10 characters required
          </Text>
        )}
      </Box>
    </ConfirmDialog>
  );
}

// ─── Status update modal ──────────────────────────────────────────────────────

function StatusUpdateModal({
  open,
  onClose,
  onConfirm,
  actionLabel,
  isLoading,
  note,
  onNoteChange,
  refundAmount,
  onRefundAmountChange,
  refundVendorNotes,
  onRefundVendorNotesChange,
  showRefundFields,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionLabel: string;
  isLoading: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  refundAmount?: string;
  onRefundAmountChange?: (v: string) => void;
  refundVendorNotes?: string;
  onRefundVendorNotesChange?: (v: string) => void;
  showRefundFields?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={actionLabel}
      description="Are you sure you want to proceed?"
      confirmLabel={actionLabel}
      colorPalette="primary"
      isLoading={isLoading}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Note (optional)
        </Text>
        <Textarea
          size="sm"
          rows={2}
          placeholder="Any notes about this status update..."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
        {showRefundFields && (
          <>
            <Text textStyle="xs" color="fg.muted" mb={1} mt={3}>
              Refund Amount (₦)
            </Text>
            <input
              type="number"
              min={0}
              placeholder="Enter refund amount..."
              value={refundAmount ?? ''}
              onChange={(e) => onRefundAmountChange?.(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--chakra-colors-border)',
                background: 'transparent',
                fontSize: '14px',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <Text textStyle="xs" color="fg.muted" mb={1} mt={3}>
              Refund Notes (internal)
            </Text>
            <Textarea
              size="sm"
              rows={2}
              placeholder="Internal notes about the refund..."
              value={refundVendorNotes ?? ''}
              onChange={(e) => onRefundVendorNotesChange?.(e.target.value)}
            />
          </>
        )}
      </Box>
    </ConfirmDialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Refund fields (amount + notes) are only collected on the initial REFUND_REQUESTED step
  const isRefundAction = pendingStatusAction?.next === 'REFUND_REQUESTED';

  // ─── Copy tracking link ─────────────────────────────────────────────────────

  const copyTrackingLink = () => {
    if (!tx) return;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${base}/track/${tx.tracking_token}`);
    toaster.create({ title: 'Tracking link copied!', type: 'info' });
  };

  // ─── Status action ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (next: OrderStatus, note?: string) => {
    try {
      if (next === 'REFUND_REQUESTED') {
        // Only on the initial refund action: persist refund amount + internal notes
        await refundStatusMutation.mutateAsync({
          id,
          status: next,
          note,
          refund_amount: refundAmount ? Number(refundAmount) : undefined,
          refund_vendor_notes: refundVendorNotes || undefined,
        });
      } else {
        // All other transitions (including later refund steps) use the plain status endpoint
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

  // ─── Payment confirm ────────────────────────────────────────────────────────

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

  // ─── Cancel ─────────────────────────────────────────────────────────────────

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

  // ─── Loading / error ────────────────────────────────────────────────────────

  if (isLoading)
    return (
      <AppShell>
        <FullPageSpinner />
      </AppShell>
    );

  if (error || !tx) {
    return (
      <AppShell>
        <Box textAlign="center" py={16}>
          <Text color="fg.muted">Order not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </Box>
      </AppShell>
    );
  }

  const nextAction = NEXT_STATUS_ACTION[tx.status];
  const canCancel = CANCELLABLE.includes(tx.status);
  const isPending = tx.status === 'PENDING';
  const allowRefund = tx.vendor?.refund_policy_type !== 'NO_REFUNDS';

  return (
    <AppShell>
      {/* Modals */}
      <PaymentConfirmModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        isLoading={paymentMutation.isPending}
      />
      <CancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancelMutation.isPending}
      />
      <StatusUpdateModal
        open={!!pendingStatusAction}
        onClose={() => { setPendingStatusAction(null); setStatusUpdateNote(''); setRefundAmount(''); setRefundVendorNotes(''); }}
        onConfirm={() =>
          pendingStatusAction && handleStatusUpdate(pendingStatusAction.next, statusUpdateNote || undefined)
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
        {/* Header */}
        <Flex align="flex-start" gap={3} mb={6} flexWrap="wrap">
          <Button
            variant="ghost"
            size="sm"
            colorPalette="gray"
            onClick={() => router.push('/orders')}
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
              onClick={() => router.push(`/orders/${id}/edit`)}
            >
              <LuPencil size={14} />
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" colorPalette="gray" onClick={copyTrackingLink}>
            <LuCopy size={14} />
            Copy Link
          </Button>
        </Flex>

        <Stack gap={4}>
          {/* ── Action bar ───────────────────────────────────────────────── */}
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
                    onClick={() => setShowPaymentModal(true)}
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
                    onClick={() =>
                      setPendingStatusAction({ label: nextAction.label, next: nextAction.next })
                    }
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
                      setPendingStatusAction({
                        label: nextAction.secondaryLabel!,
                        next: nextAction.secondaryNext!,
                      })
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
                    onClick={() => setShowCancelModal(true)}
                  >
                    <LuX size={14} />
                    Cancel
                  </Button>
                )}
              </Flex>
            </Box>
          )}

          {/* ── Order info ───────────────────────────────────────────────── */}
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

          {/* ── Order items ──────────────────────────────────────────────── */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              ORDER ITEMS
            </Text>
            <Stack gap={3}>
              {tx.items.map((item) => (
                <Flex key={item.id} align="center" gap={3} cursor="pointer" onClick={() => setSelectedItem(item)}>
                  <Box
                    w={9}
                    h={9}
                    borderRadius="lg"
                    bg="bg.subtle"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    {item.item_image_url ? (
                      isVideoUrl(item.item_image_url) ? (
                        <video
                          src={item.item_image_url}
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <img
                          src={item.item_image_url}
                          alt={item.item_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )
                    ) : (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={14} />
                      </Flex>
                    )}
                  </Box>
                  <Box flex={1} overflow="hidden">
                    <Text textStyle="sm" fontWeight="medium" truncate>
                      {item.item_name}
                    </Text>
                    {item.description && (
                      <Text textStyle="xs" color="fg.muted">
                        {item.description}
                      </Text>
                    )}
                  </Box>
                  <Stack gap={0} align="flex-end">
                    <Text textStyle="sm" fontWeight="semibold">
                      {formatCurrency(item.subtotal)}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {formatCurrency(item.item_price)} × {item.quantity}
                    </Text>
                  </Stack>
                </Flex>
              ))}

              {/* Totals */}
              <Box borderTopWidth="1px" borderColor="border" pt={3}>
                <Stack gap={1.5}>
                  <Flex justify="space-between">
                    <Text textStyle="sm" color="fg.muted">
                      Subtotal
                    </Text>
                    <Text textStyle="sm">{formatCurrency(tx.subtotal)}</Text>
                  </Flex>
                  {tx.delivery_fee != null && tx.delivery_fee > 0 && (
                    <Flex justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        Delivery fee
                      </Text>
                      <Text textStyle="sm">{formatCurrency(tx.delivery_fee)}</Text>
                    </Flex>
                  )}
                  {tx.discount_amount != null && tx.discount_amount > 0 && (
                    <Flex justify="space-between">
                      <Text textStyle="sm" color="fg.muted">
                        Discount
                      </Text>
                      <Text textStyle="sm" color="green.600" _dark={{ color: 'green.400' }}>
                        −{formatCurrency(tx.discount_amount)}
                      </Text>
                    </Flex>
                  )}
                  <Flex justify="space-between" pt={1}>
                    <Text textStyle="md" fontWeight="bold">
                      Total
                    </Text>
                    <Text textStyle="md" fontWeight="bold" color="primary.fg">
                      {formatCurrency(tx.total_amount)}
                    </Text>
                  </Flex>
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* ── Payment ──────────────────────────────────────────────────── */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              PAYMENT
            </Text>
            <Stack gap={2}>
              <Flex justify="space-between" align="center">
                <Text textStyle="sm" color="fg.muted">
                  Status
                </Text>
                {(() => {
                  const cfg = PAYMENT_STATUS_CONFIG[tx.payment_status] ?? PAYMENT_STATUS_CONFIG.UNPAID;
                  return (
                    <Box px={2} py={0.5} borderRadius="full" bg={cfg.bg} display="inline-flex">
                      <Text
                        textStyle="xs"
                        fontWeight="medium"
                        color={cfg.color}
                        _dark={{ color: cfg.darkColor }}
                      >
                        {cfg.label}
                      </Text>
                    </Box>
                  );
                })()}
              </Flex>

              {/* "Customer has sent payment" alert */}
              {tx.payment_status === 'PROOF_SUBMITTED' && (
                <Box
                  bg="orange.subtle"
                  borderRadius="lg"
                  p={3}
                  borderWidth="1px"
                  borderColor="orange.200"
                  _dark={{ borderColor: 'orange.800' }}
                >
                  <Text
                    textStyle="sm"
                    fontWeight="semibold"
                    color="orange.700"
                    _dark={{ color: 'orange.300' }}
                  >
                    Customer has sent payment
                  </Text>
                </Box>
              )}

              {tx.payment_confirmed_at && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Confirmed at
                  </Text>
                  <Text textStyle="sm">{formatDateTime(tx.payment_confirmed_at)}</Text>
                </Flex>
              )}

              {/* Receipt */}
              {tx.payment_proof_url ? (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="orange"
                  w="full"
                  onClick={() => setShowReceiptModal(true)}
                >
                  View Receipt
                </Button>
              ) : tx.payment_status !== 'UNPAID' ? (
                <Text textStyle="xs" color="fg.muted">
                  No receipt was uploaded — please check your bank to confirm payment.
                </Text>
              ) : null}
              {tx.payment_notes && (
                <Flex justify="space-between" align="flex-start" gap={4}>
                  <Text textStyle="sm" color="fg.muted" flexShrink={0}>
                    Notes
                  </Text>
                  <Text textStyle="sm" textAlign="right">
                    {tx.payment_notes}
                  </Text>
                </Flex>
              )}
            </Stack>
          </Box>

          {/* ── Refund info ──────────────────────────────────────────────── */}
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

          {/* ── Status timeline ──────────────────────────────────────────── */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
              STATUS HISTORY
            </Text>
            <StatusTimeline tx={tx} />
          </Box>

          {/* ── Buyer Review ─────────────────────────────────────────────── */}
          {tx.review && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
                BUYER REVIEW
              </Text>
              <Flex align="center" gap={3} mb={tx.review.review_text ? 2 : 0}>
                <ReviewStarsVendor rating={tx.review.overall_rating} />
                {tx.review.buyer_name && (
                  <Text textStyle="sm" color="fg.muted">{tx.review.buyer_name}</Text>
                )}
                {!tx.review.buyer_name && (
                  <Text textStyle="sm" color="fg.subtle" fontStyle="italic">Anonymous</Text>
                )}
                <Text textStyle="xs" color="fg.subtle" ml="auto">
                  {new Date(tx.review.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Flex>
              {tx.review.review_text && (
                <Text textStyle="sm" color="fg.muted" mt={1}>
                  {tx.review.review_text}
                </Text>
              )}
            </Box>
          )}

          {/* ── Notes ───────────────────────────────────────────────────── */}
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

      {/* Receipt image preview overlay */}
      {showReceiptModal && tx.payment_proof_url && (
        <Box
          position="fixed"
          inset={0}
          zIndex={200}
          bg="rgba(0,0,0,0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setShowReceiptModal(false)}
        >
          <Box position="relative" onClick={(e) => e.stopPropagation()}>
            <Flex justify="flex-end" mb={2}>
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setShowReceiptModal(false)}
              >
                <LuX size={16} />
                Close
              </Button>
            </Flex>
            <img
              src={tx.payment_proof_url}
              alt="Payment receipt"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '12px',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>
      )}
    </AppShell>
  );
}
