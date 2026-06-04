'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuCircleAlert, LuCircleCheck, LuClock, LuPackage, LuPencil, LuShoppingCart, LuStore, LuTruck } from 'react-icons/lu';
import {
  useTransactionByToken,
  useBuyerCancelTransaction,
  useBuyerConfirmDelivery,
  useBuyerCloseResolution,
  useBuyerRequestRefund,
} from '@/app/_hooks/transaction';
import { useEditReview } from '@/app/_hooks/reviews';
import { ReviewStars } from '@/components/review/ReviewStars';
import { Transaction, TransactionItem, TransactionStatus, TransactionStatusHistoryEntry } from '@/app/_types';
import { TransactionStatusBadge } from '@/components/transaction/TransactionStatusBadge';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { formatDate, formatCurrency, formatDateTime, isVideoUrl } from '@/app/_lib/transactionHelpers';
import { ItemDetailModal } from '@/components/transaction/ItemDetailModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toaster } from '@/components/ui/toaster';
import { ReviewForm } from '@/components/review/ReviewForm';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react';

// ─── Status timeline for buyer ────────────────────────────────────────────────

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
  IN_PROGRESS: 'Being Prepared',
  READY_FOR_DISPATCH: 'Ready to Ship',
  SHIPPED: 'On Its Way',
  DELIVERED: 'Delivered',
  COMPLETED: 'Order Complete',
};

const STATUS_ICONS: Partial<Record<TransactionStatus, React.ElementType>> = {
  PENDING: LuClock,
  CONFIRMED: LuCircleCheck,
  IN_PROGRESS: LuPackage,
  READY_FOR_DISPATCH: LuPackage,
  SHIPPED: LuTruck,
  DELIVERED: LuCircleCheck,
  COMPLETED: LuCircleCheck,
};

// Refund-related statuses and their buyer-friendly labels
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

// Delivery steps shown in the dual timeline (up to and including DELIVERED)
const DELIVERY_STEPS = STATUS_ORDER.slice(0, STATUS_ORDER.indexOf('DELIVERED') + 1);

function BuyerTimeline({
  status,
  statusHistory = [],
}: {
  status: TransactionStatus;
  statusHistory?: TransactionStatusHistoryEntry[];
}) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isRefundPath =
    REFUND_STATUS_SET.has(status) ||
    (status === 'COMPLETED' &&
      statusHistory.some((h) => REFUND_STATUS_SET.has(h.to_status)));

  // ── Cancelled ─────────────────────────────────────────────────────────────
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

  // ── Dual timeline — all refund paths and COMPLETED-after-refund ───────────
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
        {/* Delivery journey — all steps done */}
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

        {/* Divider */}
        <Flex align="center" gap={2} px={1}>
          <Box flex={1} h="1px" bg="border" />
          <Text textStyle="2xs" color="fg.subtle" fontWeight="medium" letterSpacing="wider">
            REFUND PROCESS
          </Text>
          <Box flex={1} h="1px" bg="border" />
        </Flex>

        {/* Refund journey */}
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
          // History not yet populated (race condition on first load)
          <Box p={3} bg="orange.subtle" borderRadius="lg" borderWidth="1px" borderColor="orange.200">
            <Text textStyle="xs" color="orange.700" _dark={{ color: 'orange.300' }}>
              Your refund request has been received. The seller is reviewing it.
            </Text>
          </Box>
        )}
      </Stack>
    );
  }

  // ── Normal delivery timeline ───────────────────────────────────────────────
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
                w={9} h={9} borderRadius="full" align="center" justify="center"
                bg={done ? 'primary.500' : active ? 'primary.subtle' : 'bg.subtle'}
                borderWidth="2px"
                borderColor={done ? 'primary.500' : active ? 'primary.300' : 'border'}
                flexShrink={0}
              >
                <Icon
                  size={16}
                  color={
                    done ? 'white'
                      : active ? 'var(--chakra-colors-primary-fg)'
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

// ─── Delivery window banner ────────────────────────────────────────────────────

function DeliveryBanner({ tx }: { tx: Transaction }) {
  if (!tx.expected_delivery_start && !tx.expected_delivery_end) return null;

  const isLate = tx.expected_delivery_end
    ? new Date() > new Date(tx.expected_delivery_end) &&
      !['DELIVERED', 'COMPLETED'].includes(tx.status)
    : false;

  return (
    <Box
      p={4}
      bg={isLate ? 'orange.subtle' : 'primary.subtle'}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isLate ? 'orange.200' : 'primary.200'}
      _dark={isLate ? { borderColor: 'orange.800' } : {}}
    >
      <Flex align="center" gap={2} mb={1}>
        <Box
          color={isLate ? 'orange.700' : 'primary.fg'}
          _dark={isLate ? { color: 'orange.300' } : {}}
          display="flex"
          alignItems="center"
        >
          <LuTruck size={16} />
        </Box>
        <Text
          textStyle="sm"
          fontWeight="semibold"
          color={isLate ? 'orange.700' : 'primary.fg'}
          _dark={isLate ? { color: 'orange.300' } : {}}
        >
          {isLate ? 'Expected delivery may be delayed' : 'Expected Delivery Window'}
        </Text>
      </Flex>
      <Text
        textStyle="sm"
        color={isLate ? 'orange.600' : 'primary.fg'}
        _dark={isLate ? { color: 'orange.400' } : {}}
      >
        {formatDate(tx.expected_delivery_start)} – {formatDate(tx.expected_delivery_end)}
      </Text>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const { data: tx, isLoading, error } = useTransactionByToken(token);

  const [selectedItem, setSelectedItem] = useState<TransactionItem | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviewModalAutoOpened = useRef(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editReviewText, setEditReviewText] = useState('');

  const cancelMutation = useBuyerCancelTransaction(token);
  const confirmDeliveryMutation = useBuyerConfirmDelivery(token);
  const closeResolutionMutation = useBuyerCloseResolution(token);
  const refundRequestMutation = useBuyerRequestRefund(token);
  const editReviewMutation = useEditReview();

  // Must be before early returns — React Hooks rule
  useEffect(() => {
    if (!tx) return;
    const businessName = (tx.vendor as { business_name?: string | null })?.business_name;
    document.title = businessName
      ? `Order ${tx.reference} · ${businessName} · ShopCop`
      : `Order ${tx.reference} · ShopCop`;
  }, [tx]);

  // Auto-open review modal once when tx is COMPLETED with no review,
  // unless the buyer already dismissed it this session.
  // setTimeout defers the setState out of the effect body to avoid
  // the cascading-render warning from synchronous setState in effects.
  useEffect(() => {
    if (!tx || reviewModalAutoOpened.current) return;
    if (tx.status !== 'COMPLETED' || tx.review) return;
    const dismissedKey = `review-dismissed-${token}`;
    if (sessionStorage.getItem(dismissedKey)) return;
    reviewModalAutoOpened.current = true;
    const t = setTimeout(() => setShowReviewModal(true), 0);
    return () => clearTimeout(t);
  }, [tx, token]);

  if (isLoading) return <FullPageSpinner />;

  if (error || !tx) {
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="bg" p={4}>
        <Box textAlign="center" maxW="360px">
          <Flex
            w={16}
            h={16}
            borderRadius="full"
            bg="red.subtle"
            align="center"
            justify="center"
            mx="auto"
            mb={4}
          >
            <LuPackage size={28} color="var(--chakra-colors-red-600)" />
          </Flex>
          <Heading textStyle="xl" fontWeight="bold" mb={2}>
            Order Not Found
          </Heading>
          <Text textStyle="sm" color="fg.muted">
            This tracking link may be invalid or expired. Check with your seller for the correct
            link.
          </Text>
        </Box>
      </Flex>
    );
  }

  const vendor = tx.vendor as {
    business_name?: string | null;
    profile_photo_url?: string | null;
    whatsapp_number?: string | null;
    refund_policy_type?: string | null;
    refund_duration_days?: number | null;
  };

  const isUnpaid = tx.payment_status === 'UNPAID';
  const isProofSubmitted = tx.payment_status === 'PROOF_SUBMITTED';
  const isCancelled = tx.status === 'CANCELLED';
  const showTimeline = (!isUnpaid && !isProofSubmitted) || isCancelled;
  const isCompletedAfterRefund = tx.status === 'COMPLETED' && tx.refund_status !== 'NONE';
  const isPending = tx.status === 'PENDING';
  const isDelivered = tx.status === 'DELIVERED';
  const isAwaitingClose = tx.status === 'REFUNDED' || tx.status === 'RESOLVED';

  // Refund window check: hide button once refund_duration_days has elapsed.
  // Explicit null check: null/undefined means "no time limit" (always refundable per policy).
  // A value of 0 would mean "expired immediately" — not a valid use case but guarded correctly.
  const refundWindowStart = tx.completed_at ?? tx.delivered_at;
  const refundCutoffMs = (vendor?.refund_duration_days ?? 0) * 24 * 60 * 60 * 1000;
  const isWithinRefundWindow =
    vendor?.refund_duration_days == null ||   // no duration set → always within window
    !refundWindowStart ||
    Date.now() - new Date(refundWindowStart).getTime() <= refundCutoffMs;

  const isRefundable =
    (tx.status === 'DELIVERED' || tx.status === 'COMPLETED') &&
    vendor?.refund_policy_type !== 'NO_REFUNDS' &&
    isWithinRefundWindow;

  // Review edit window: 7 days from creation
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const canEditReview =
    !!tx.review &&
    Date.now() - new Date(tx.review.created_at).getTime() < SEVEN_DAYS_MS;

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
    <Box minH="100dvh" bg="bg">
      {/* Brand header */}
      <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border" px={4} py={3}>
        <Flex align="center" justify="space-between" maxW="520px" mx="auto">
          <Flex align="center" gap={2}>
            <Flex
              w={7}
              h={7}
              borderRadius="md"
              bg="primary.500"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuStore size={14} color="white" />
            </Flex>
            <Text fontWeight="bold" textStyle="sm" color="fg">
              ShopCop
            </Text>
          </Flex>
          {vendor?.business_name && (
            <Text textStyle="sm" color="fg.muted">
              by {vendor.business_name}
            </Text>
          )}
        </Flex>
      </Box>

      {/* Content */}
      <Box maxW="520px" mx="auto" px={4} py={6}>
        <Stack gap={4}>
          {/* Page title */}
          <Box>
            <Heading textStyle="xl" fontWeight="bold" color="fg">
              Your order{vendor?.business_name ? ` with ${vendor.business_name}` : ''}
            </Heading>
            <Text textStyle="sm" color="fg.muted" mt={0.5}>
              Track your delivery below
            </Text>
          </Box>

          {/* ── ORDER INFO & SUMMARY ────────────────────────────────────── */}

          {/* Order header */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Flex align="center" justify="space-between" mb={1}>
              <Box>
                <Text textStyle="2xs" color="fg.subtle" fontWeight="medium">
                  ORDER ID
                </Text>
                <Text textStyle="xs" color="fg.muted" fontFamily="mono">
                  {tx.reference}
                </Text>
              </Box>
              <TransactionStatusBadge status={tx.status} />
            </Flex>
            <Text textStyle="xs" color="fg.muted" mt={1}>
              {formatDateTime(tx.created_at)}
            </Text>
          </Box>

          {/* Order items */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              YOUR ORDER
            </Text>

            <Stack gap={3}>
              {(tx.items as Transaction['items']).map((item, i) => (
                <Flex key={i} align="center" gap={3} cursor="pointer" onClick={() => setSelectedItem(item)}>
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
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                      ×{item.quantity}
                    </Text>
                  </Stack>
                </Flex>
              ))}
              <Box borderTopWidth="1px" borderColor="border" pt={2}>
                <Flex justify="space-between">
                  <Text textStyle="md" fontWeight="bold">
                    Total
                  </Text>
                  <Text textStyle="md" fontWeight="bold" color="primary.fg">
                    {formatCurrency(tx.total_amount)}
                  </Text>
                </Flex>
              </Box>
            </Stack>
          </Box>

          {/* Delivery details */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              DELIVERY
            </Text>
            <Stack gap={2}>
              <Flex justify="space-between">
                <Text textStyle="sm" color="fg.muted">
                  Method
                </Text>
                <Text textStyle="sm" color="fg">
                  {tx.delivery_method === 'PICKUP'
                    ? 'Pickup'
                    : tx.delivery_method === 'DISPATCH'
                      ? 'Dispatch'
                      : 'Waybill'}
                </Text>
              </Flex>
              {tx.delivery_fee != null && tx.delivery_fee > 0 && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Delivery fee
                  </Text>
                  <Text textStyle="sm" color="fg">
                    {formatCurrency(tx.delivery_fee)}
                  </Text>
                </Flex>
              )}
            </Stack>
          </Box>

          {/* Seller notes */}
          {tx.order_notes && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">
                NOTE FROM SELLER
              </Text>
              <Text textStyle="sm" color="fg">
                {tx.order_notes}
              </Text>
            </Box>
          )}

          {/* ── TRACKING ────────────────────────────────────────────────── */}

          {/* Payment submitted banner */}
          {isProofSubmitted && (
            <Box p={4} bg="green.subtle" borderRadius="xl" borderWidth="1px" borderColor="green.200" _dark={{ borderColor: 'green.800' }}>
              <Flex align="center" gap={2} mb={1}>
                <Box color="green.600" _dark={{ color: 'green.400' }} display="flex" alignItems="center">
                  <LuCircleCheck size={18} />
                </Box>
                <Text textStyle="sm" fontWeight="semibold" color="green.700" _dark={{ color: 'green.300' }}>
                  Payment submitted
                </Text>
              </Flex>
              <Text textStyle="sm" color="green.600" _dark={{ color: 'green.400' }}>
                Your vendor will confirm your payment shortly. Check back soon.
              </Text>
            </Box>
          )}

          {/* Delivery window — hide before payment or when cancelled */}
          {!isUnpaid && !isCancelled && <DeliveryBanner tx={tx} />}

          {/* Completed-after-refund banner */}
          {isCompletedAfterRefund && (
            <Box p={4} bg="teal.subtle" borderRadius="xl" borderWidth="1px" borderColor="teal.200" _dark={{ borderColor: 'teal.800' }}>
              <Flex align="center" gap={2} mb={1}>
                <Box color="teal.600" _dark={{ color: 'teal.300' }} display="flex" alignItems="center">
                  <LuCircleCheck size={16} />
                </Box>
                <Text textStyle="sm" fontWeight="semibold" color="teal.700" _dark={{ color: 'teal.300' }}>
                  Order Completed
                </Text>
              </Flex>
              <Text textStyle="sm" color="teal.600" _dark={{ color: 'teal.400' }}>
                {tx.refund_status === 'REFUNDED'
                  ? `Your order has been completed following a refund${tx.refund_amount != null ? ` of ${formatCurrency(tx.refund_amount)}` : ''}. Allow 2–5 business days for funds to reach your account.`
                  : 'Your order has been completed after being resolved. Contact the seller if you need further assistance.'}
              </Text>
            </Box>
          )}

          {/* Order status timeline — hide until payment is confirmed */}
          {showTimeline && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
                ORDER STATUS
              </Text>
              <BuyerTimeline status={tx.status} statusHistory={tx.status_history} />
            </Box>
          )}

          {/* ── REVIEW ──────────────────────────────────────────────────── */}

          {/* Submitted review display */}
          {tx.status === 'COMPLETED' && tx.review && (
            <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Flex justify="space-between" align="center" mb={3}>
                <Text textStyle="xs" color="fg.muted" fontWeight="medium">YOUR REVIEW</Text>
                {canEditReview && !isEditingReview && (
                  <Button size="xs" variant="ghost" color="fg.muted" onClick={() => { setEditReviewText(tx.review?.review_text ?? ''); setIsEditingReview(true); }}>
                    <LuPencil size={12} />
                    Edit
                  </Button>
                )}
              </Flex>
              <ReviewStars rating={tx.review.overall_rating} size="sm" />
              {isEditingReview ? (
                <Box mt={3}>
                  <Textarea value={editReviewText} onChange={(e) => setEditReviewText(e.target.value)} placeholder="What would you like others to know?" maxLength={2000} rows={3} mb={2} />
                  <Flex gap={2} justify="flex-end">
                    <Button size="sm" variant="outline" onClick={() => setIsEditingReview(false)}>Cancel</Button>
                    <Button size="sm" colorPalette="primary" loading={editReviewMutation.isPending}
                      onClick={() => editReviewMutation.mutate(
                        { tracking_token: token, review_text: editReviewText.trim() || null },
                        {
                          onSuccess: () => { setIsEditingReview(false); toaster.create({ title: 'Review updated', type: 'success' }); },
                          onError: (err) => toaster.create({ title: err.message || 'Failed to update review', type: 'error' }),
                        }
                      )}
                    >Save</Button>
                  </Flex>
                </Box>
              ) : tx.review.review_text && (
                <Text textStyle="sm" color="fg.muted" mt={2}>{tx.review.review_text}</Text>
              )}
            </Box>
          )}

          {/* Leave a Review CTA */}
          {tx.status === 'COMPLETED' && !tx.review && (
            <Box p={4} bg="primary.subtle" borderRadius="xl" borderWidth="1px" borderColor="primary.200">
              <Text textStyle="sm" fontWeight="semibold" color="primary.fg" mb={2}>How was your experience?</Text>
              <Text textStyle="xs" color="fg.muted" mb={3}>Share your feedback — it helps other buyers and supports the vendor.</Text>
              <Button colorPalette="primary" size="sm" onClick={() => setShowReviewModal(true)}>Leave a Review</Button>
            </Box>
          )}

          {/* Review modal */}
          <DialogRoot open={showReviewModal} onOpenChange={({ open }) => { if (!open) sessionStorage.setItem(`review-dismissed-${token}`, '1'); setShowReviewModal(open); }} placement="center" motionPreset="slide-in-bottom">
            <DialogBackdrop />
            <DialogPositioner>
              <DialogContent maxW="480px" mx={4}>
                <DialogHeader>
                  <DialogTitle>Leave a Review</DialogTitle>
                  <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody pb={6}>
                  <ReviewForm trackingToken={token} onSuccess={() => setShowReviewModal(false)} />
                </DialogBody>
              </DialogContent>
            </DialogPositioner>
          </DialogRoot>

          {/* ── ACTIONS ─────────────────────────────────────────────────── */}

          {/* Checkout CTA — shown when payment not yet submitted and not cancelled */}
          {isUnpaid && !isCancelled && (
            <Box bg="primary.subtle" borderRadius="xl" borderWidth="1px" borderColor="primary.200" p={5}>
              <Flex align="center" gap={3} mb={3}>
                <Flex w={10} h={10} borderRadius="full" bg="primary.500" align="center" justify="center" flexShrink={0}>
                  <LuShoppingCart size={18} color="white" />
                </Flex>
                <Box>
                  <Text textStyle="md" fontWeight="semibold" color="fg">Payment required</Text>
                  <Text textStyle="sm" color="fg.muted">Send payment to confirm your order</Text>
                </Box>
              </Flex>
              <Button colorPalette="primary" w="full" onClick={() => router.push(`/track/${token}/checkout`)}>
                Complete Checkout
              </Button>
            </Box>
          )}

          {/* Buyer confirm delivery — only when DELIVERED */}
          {isDelivered && (
            <Box p={4} bg="green.subtle" borderRadius="xl" borderWidth="1px" borderColor="green.200" _dark={{ borderColor: 'green.800' }}>
              <Flex align="center" gap={2} mb={3}>
                <Box color="green.600" _dark={{ color: 'green.400' }} display="flex" alignItems="center">
                  <LuCircleCheck size={18} />
                </Box>
                <Box>
                  <Text textStyle="sm" fontWeight="semibold" color="green.700" _dark={{ color: 'green.300' }}>Package Delivered</Text>
                  <Text textStyle="xs" color="green.600" _dark={{ color: 'green.400' }}>Received your order? Confirm to complete.</Text>
                </Box>
              </Flex>
              <Button w="full" colorPalette="green" size="sm" onClick={() => setShowDeliveryConfirm(true)} loading={confirmDeliveryMutation.isPending}>
                Yes, I Received It
              </Button>
            </Box>
          )}

          {/* Close order CTA — REFUNDED or RESOLVED */}
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

          {/* Buyer request refund — when DELIVERED or COMPLETED */}
          {isRefundable && (
            <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">NEED HELP?</Text>
              <Button w="full" variant="outline" colorPalette="orange" size="sm" onClick={() => setShowRefundModal(true)}>
                Request Refund
              </Button>
            </Box>
          )}

          {/* Buyer cancel — only when PENDING */}
          {isPending && (
            <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
              <Text textStyle="xs" color="fg.muted" mb={2} fontWeight="medium">ACTIONS</Text>
              <Button w="full" variant="outline" colorPalette="red" size="sm" onClick={() => setShowCancelConfirm(true)}>
                Cancel Order
              </Button>
            </Box>
          )}

          {/* Contact seller */}
          {vendor?.whatsapp_number && (
            <a
              href={`https://wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I'm checking on my order ${tx.reference}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#22c55e',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Contact Seller on WhatsApp
            </a>
          )}

          {/* Footer */}
          <Text textStyle="xs" color="fg.subtle" textAlign="center">
            Powered by ShopCop · Verified Nigerian Vendors
          </Text>
        </Stack>
      </Box>

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

      <ItemDetailModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem!}
      />
    </Box>
  );
}
