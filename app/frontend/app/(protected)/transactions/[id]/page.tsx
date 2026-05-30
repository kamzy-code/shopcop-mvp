'use client';
import { useState } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react';
import { useRouter, useParams } from 'next/navigation';
import {
  LuArrowLeft,
  LuCheck,
  LuCircleCheck,
  LuClock,
  LuCopy,
  LuPackage,
  LuPencil,
  LuTruck,
  LuX,
} from 'react-icons/lu';
import { AppShell } from '@/components/shared/appShell';
import { TransactionStatusBadge } from '@/components/transaction/TransactionStatusBadge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import {
  useTransaction,
  useUpdateTransactionStatus,
  useConfirmPayment,
  useCancelTransaction,
} from '@/app/_hooks/transaction';
import { Transaction, TransactionStatus } from '@/app/_types';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  isVideoUrl,
} from '@/app/_lib/transactionHelpers';

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
    TransactionStatus,
    {
      label: string;
      next: TransactionStatus;
      secondaryLabel?: string;
      secondaryNext?: TransactionStatus;
    }
  >
> = {
  CONFIRMED: { label: 'Mark In Progress', next: 'IN_PROGRESS' },
  IN_PROGRESS: { label: 'Mark Ready for Dispatch', next: 'READY_FOR_DISPATCH' },
  READY_FOR_DISPATCH: { label: 'Mark Shipped', next: 'SHIPPED' },
  SHIPPED: { label: 'Mark Delivered', next: 'DELIVERED' },
  DELIVERED: { label: 'Mark Completed', next: 'COMPLETED' },
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

const CANCELLABLE: TransactionStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
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

const STATUS_ORDER: TransactionStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'READY_FOR_DISPATCH',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
];

const STATUS_LABELS: Partial<Record<TransactionStatus, string>> = {
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

function StatusTimeline({ tx }: { tx: Transaction }) {
  const currentIndex = STATUS_ORDER.indexOf(tx.status);
  const isFinalBad = [
    'CANCELLED',
    'REFUNDED',
    'RESOLVED',
    'REFUND_REQUESTED',
    'REFUND_IN_PROGRESS',
  ].includes(tx.status);

  if (isFinalBad) {
    return (
      <Box
        p={4}
        bg="red.subtle"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="red.200"
        _dark={{ borderColor: 'red.800' }}
      >
        <Text
          textStyle="sm"
          fontWeight="semibold"
          color="red.700"
          _dark={{ color: 'red.300' }}
        >
          {STATUS_LABELS[tx.status] ?? tx.status}
        </Text>
        {tx.cancellation_reason && (
          <Text textStyle="xs" color="red.600" _dark={{ color: 'red.400' }} mt={1}>
            Reason: {tx.cancellation_reason}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Stack gap={0}>
      {STATUS_ORDER.map((status, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const historyEntry = tx.status_history.find((h) => h.to_status === status);
        const isLast = i === STATUS_ORDER.length - 1;

        return (
          <Flex key={status} gap={3} align="flex-start">
            <Flex direction="column" align="center">
              <TimelineIcon done={done} active={active} />
              {!isLast && (
                <Box w="2px" flex={1} minH={6} bg={done ? 'primary.200' : 'border'} my={1} />
              )}
            </Flex>
            <Box pb={isLast ? 0 : 2} pt={0.5}>
              <Text
                textStyle="sm"
                fontWeight={active ? 'semibold' : 'normal'}
                color={active ? 'fg' : done ? 'fg.muted' : 'fg.subtle'}
              >
                {STATUS_LABELS[status] ?? status}
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
            </Box>
          </Flex>
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
      description="Confirming payment will mark this transaction as CONFIRMED and deduct stock from your catalog for linked products. This cannot be undone."
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
      title="Cancel Transaction"
      description="This will cancel the transaction and restore any deducted stock."
      confirmLabel="Cancel Transaction"
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
          placeholder="Why is this transaction being cancelled?"
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
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionLabel: string;
  isLoading: boolean;
  note: string;
  onNoteChange: (v: string) => void;
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
      </Box>
    </ConfirmDialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    label: string;
    next: TransactionStatus;
  } | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [errorModal, setErrorModal] = useState({ open: false, title: '', description: '' });

  const { data: tx, isLoading, error } = useTransaction(id);
  const statusMutation = useUpdateTransactionStatus();
  const paymentMutation = useConfirmPayment();
  const cancelMutation = useCancelTransaction();

  // ─── Copy tracking link ─────────────────────────────────────────────────────

  const copyTrackingLink = () => {
    if (!tx) return;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${base}/track/${tx.tracking_token}`);
    toaster.create({ title: 'Tracking link copied!', type: 'info' });
  };

  // ─── Status action ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (next: TransactionStatus, note?: string) => {
    try {
      await statusMutation.mutateAsync({ id, status: next, note });
      setPendingStatusAction(null);
      setStatusUpdateNote('');
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
      toaster.create({ title: 'Transaction cancelled', type: 'success' });
    } catch (err) {
      setShowCancelModal(false);
      setErrorModal({
        open: true,
        title: 'Failed to cancel transaction',
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
          <Text color="fg.muted">Transaction not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.push('/transactions')}>
            Back to Transactions
          </Button>
        </Box>
      </AppShell>
    );
  }

  const nextAction = NEXT_STATUS_ACTION[tx.status];
  const canCancel = CANCELLABLE.includes(tx.status);
  const isPending = tx.status === 'PENDING';

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
        onClose={() => { setPendingStatusAction(null); setStatusUpdateNote(''); }}
        onConfirm={() =>
          pendingStatusAction && handleStatusUpdate(pendingStatusAction.next, statusUpdateNote || undefined)
        }
        actionLabel={pendingStatusAction?.label ?? ''}
        isLoading={statusMutation.isPending}
        note={statusUpdateNote}
        onNoteChange={setStatusUpdateNote}
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
            onClick={() => router.push('/transactions')}
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
              <TransactionStatusBadge status={tx.status} />
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
              onClick={() => router.push(`/transactions/${id}/edit`)}
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
                  >
                    <LuCircleCheck size={14} />
                    Confirm Payment
                  </Button>
                )}
                {nextAction && !isPending && (
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
                {nextAction?.secondaryNext && !isPending && (
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
                <Flex key={item.id} align="center" gap={3}>
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
                    {item.variant && (
                      <Text textStyle="xs" color="fg.muted">
                        {item.variant}
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

              {/* Receipt */}
              {tx.payment_proof_url ? (
                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="orange"
                  alignSelf="flex-start"
                  onClick={() => setShowReceiptModal(true)}
                >
                  View Receipt
                </Button>
              ) : tx.payment_status !== 'UNPAID' ? (
                <Text textStyle="xs" color="fg.muted">
                  No receipt was uploaded — please check your bank to confirm payment.
                </Text>
              ) : null}

              {tx.payment_confirmed_at && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Confirmed at
                  </Text>
                  <Text textStyle="sm">{formatDateTime(tx.payment_confirmed_at)}</Text>
                </Flex>
              )}
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

          {/* ── Status timeline ──────────────────────────────────────────── */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
              STATUS HISTORY
            </Text>
            <StatusTimeline tx={tx} />
          </Box>

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
