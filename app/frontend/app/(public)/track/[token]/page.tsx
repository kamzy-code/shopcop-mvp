'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { LuCircleCheck, LuPackage, LuPencil, LuStore } from 'react-icons/lu';
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
import { useOrderByToken } from '@/app/_hooks/order';
import { useEditReview } from '@/app/_hooks/reviews';
import { OrderItem } from '@/app/_types';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { formatCurrency, formatDateTime } from '@/app/_lib/orderHelpers';
import { ItemDetailModal } from '@/components/order/ItemDetailModal';
import { ReviewStars } from '@/components/review/ReviewStars';
import { ReviewMediaViewer } from '@/components/review/ReviewMediaViewer';
import dynamic from 'next/dynamic';
import { toaster } from '@/components/ui/toaster';

const ReviewForm = dynamic(
  () => import('@/components/review/ReviewForm').then(m => ({ default: m.ReviewForm })),
  { loading: () => <Box h="200px" bg="bg.subtle" borderRadius="xl" /> }
);
import { BuyerTimeline } from '@/components/track/BuyerTimeline';
import { DeliveryBanner } from '@/components/track/DeliveryBanner';
import { TrackingOrderSummary } from '@/components/track/TrackingOrderSummary';
import { BuyerActions } from '@/components/track/BuyerActions';

export default function TrackingPage() {
  const params = useParams();
  const token = params?.token as string;
  const { data: tx, isLoading, error } = useOrderByToken(token);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const reviewModalAutoOpened = useRef(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editReviewText, setEditReviewText] = useState('');
  const [viewerMediaIndex, setViewerMediaIndex] = useState<number | null>(null);
  const editReviewMutation = useEditReview();

  useEffect(() => {
    if (!tx) return;
    const businessName = (tx.vendor as { business_name?: string | null })?.business_name;
    document.title = businessName
      ? `Order ${tx.reference} · ${businessName} · ShopCop`
      : `Order ${tx.reference} · ShopCop`;
  }, [tx]);

  useEffect(() => {
    if (!tx || reviewModalAutoOpened.current) return;
    if (tx.status !== 'COMPLETED' || tx.review) return;
    const dismissedKey = `review-dismissed-${token}`;
    if (sessionStorage.getItem(dismissedKey)) return;
    reviewModalAutoOpened.current = true;
    const t = setTimeout(() => setShowReviewModal(true), 0);
    return () => clearTimeout(t);
  }, [tx, token]);

  if (isLoading) {
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="bg" p={4}>
        <Stack align="center" gap={4} w="full" maxW="600px">
          <Box w="full" h="120px" bg="bg.subtle" borderRadius="xl" />
          <Box w="full" h="200px" bg="bg.subtle" borderRadius="xl" />
          <Box w="full" h="80px" bg="bg.subtle" borderRadius="xl" />
        </Stack>
      </Flex>
    );
  }

  if (error || !tx) {
    return (
      <Flex minH="100dvh" align="center" justify="center" bg="bg" p={4}>
        <Box textAlign="center" maxW="360px">
          <Flex w={16} h={16} borderRadius="full" bg="red.subtle" align="center" justify="center" mx="auto" mb={4}>
            <LuPackage size={28} color="var(--chakra-colors-red-600)" />
          </Flex>
          <Heading textStyle="xl" fontWeight="bold" mb={2}>Order Not Found</Heading>
          <Text textStyle="sm" color="fg.muted">
            This tracking link may be invalid or expired. Check with your seller for the correct link.
          </Text>
        </Box>
      </Flex>
    );
  }

  const vendor = tx.vendor as {
    business_name?: string | null;
    whatsapp_number?: string | null;
    refund_policy_type?: string | null;
  };

  const isUnpaid = tx.payment_status === 'UNPAID';
  const isProofSubmitted = tx.payment_status === 'PROOF_SUBMITTED';
  const isCancelled = tx.status === 'CANCELLED';
  const showTimeline = (!isUnpaid && !isProofSubmitted) || isCancelled;
  const isCompletedAfterRefund = tx.status === 'COMPLETED' && tx.refund_status !== 'NONE';

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const canEditReview =
    !!tx.review &&
    Date.now() - new Date(tx.review.created_at).getTime() < SEVEN_DAYS_MS;

  return (
    <Box minH="100dvh" bg="bg">
      <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border" px={4} py={3}>
        <Flex align="center" justify="space-between" maxW="520px" mx="auto">
          <Flex align="center" gap={2}>
            <Flex w={7} h={7} borderRadius="md" bg="primary.500" align="center" justify="center" flexShrink={0}>
              <LuStore size={14} color="white" />
            </Flex>
            <Text fontWeight="bold" textStyle="sm" color="fg">ShopCop</Text>
          </Flex>
          {vendor?.business_name && (
            <Text textStyle="sm" color="fg.muted">by {vendor.business_name}</Text>
          )}
        </Flex>
      </Box>

      <Box maxW="520px" mx="auto" px={4} py={6}>
        <Stack gap={4}>
          <Box>
            <Heading textStyle="xl" fontWeight="bold" color="fg">
              Your order{vendor?.business_name ? ` with ${vendor.business_name}` : ''}
            </Heading>
            <Text textStyle="sm" color="fg.muted" mt={0.5}>Track your delivery below</Text>
          </Box>

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Flex align="center" justify="space-between" mb={1}>
              <Box>
                <Text textStyle="2xs" color="fg.subtle" fontWeight="medium">ORDER ID</Text>
                <Text textStyle="xs" color="fg.muted" fontFamily="mono">{tx.reference}</Text>
              </Box>
              <OrderStatusBadge status={tx.status} />
            </Flex>
            <Text textStyle="xs" color="fg.muted" mt={1}>{formatDateTime(tx.created_at)}</Text>
          </Box>

          <BuyerActions token={token} tx={tx} />

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

          {!isUnpaid && !isCancelled && <DeliveryBanner tx={tx} />}

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
              {tx.review.media && tx.review.media.length > 0 && (
                <Flex gap={2} mt={3} flexWrap="wrap">
                  {tx.review.media.map((m: { id: string; media_url: string; media_type: string }, i: number) => (
                    <Box
                      key={m.id}
                      w={16}
                      h={16}
                      borderRadius="md"
                      overflow="hidden"
                      cursor="pointer"
                      flexShrink={0}
                      borderWidth="1px"
                      borderColor="border"
                      onClick={() => setViewerMediaIndex(i)}
                    >
                      {m.media_type === 'VIDEO' ? (
                        <video src={m.media_url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <img src={m.media_url} alt="Review media" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
                    </Box>
                  ))}
                </Flex>
              )}
            </Box>
          )}

          {tx.status === 'COMPLETED' && !tx.review && (
            <>
              <Box p={4} bg="primary.subtle" borderRadius="xl" borderWidth="1px" borderColor="primary.200">
                <Text textStyle="sm" fontWeight="semibold" color="primary.fg" mb={2}>How was your experience?</Text>
                <Text textStyle="xs" color="fg.muted" mb={3}>Share your feedback — it helps other buyers and supports the vendor.</Text>
                <Button colorPalette="primary" size="sm" onClick={() => setShowReviewModal(true)}>Leave a Review</Button>
              </Box>

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
            </>
          )}

          {showTimeline && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">ORDER STATUS</Text>
              <BuyerTimeline
                status={tx.status}
                statusHistory={tx.status_history}
              />
            </Box>
          )}

          <TrackingOrderSummary tx={tx} onSelectItem={setSelectedItem} />

          <Text textStyle="xs" color="fg.subtle" textAlign="center">
            Powered by ShopCop · Verified Nigerian Vendors
          </Text>
        </Stack>
      </Box>

      <ItemDetailModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem!}
      />

      {viewerMediaIndex !== null && tx?.review?.media && (
        <ReviewMediaViewer
          media={tx.review.media}
          initialIndex={viewerMediaIndex}
          onClose={() => setViewerMediaIndex(null)}
        />
      )}
    </Box>
  );
}
