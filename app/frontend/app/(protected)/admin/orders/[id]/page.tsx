'use client';
import { use, useState } from 'react';
import { Alert, Box, Button, Flex, Heading, Image, Spinner, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { LuArrowLeft, LuStar } from 'react-icons/lu';
import { useAdminOrder } from '@/app/_hooks/admin';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';

function InfoRow({ label, value }: { label: string; value?: string | null | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <Flex gap={3}>
      <Text textStyle="sm" color="fg.muted" w="44" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color="fg" fontWeight="medium">
        {display}
      </Text>
    </Flex>
  );
}

function formatNaira(value: number) {
  return `₦${Number(value).toLocaleString('en-NG')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: order, isLoading, isError } = useAdminOrder(id);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" color="primary.500" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Box py={12} textAlign="center">
        <Text color="red.500">Failed to load this order. Please try again.</Text>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="fg.muted">Order not found.</Text>
      </Box>
    );
  }

  const awaitingPaymentConfirmation = order.payment_status === 'PROOF_SUBMITTED';
  const hasActiveRefundRequest = order.refund_status === 'REQUESTED' || order.refund_status === 'IN_PROGRESS';
  const hasDeliveryWindow = order.expected_delivery_start || order.expected_delivery_end;

  return (
    <Stack gap={8}>
      {order.payment_proof_url && (
        <ImagePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={order.payment_proof_url}
          alt="Payment proof"
          title="Payment Proof"
        />
      )}

      <Button variant="ghost" size="sm" color="fg.muted" w="fit-content" px={0} onClick={() => router.push('/admin/orders')}>
        <LuArrowLeft size={14} /> Back to Orders
      </Button>

      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
            {order.reference}
          </Heading>
          <Flex align="center" gap={2}>
            <Box px={2} py={0.5} borderRadius="md" bg="bg.subtle" borderWidth="1px" borderColor="border">
              <Text textStyle="xs" fontWeight="medium" color="fg">
                {order.status.replace(/_/g, ' ')}
              </Text>
            </Box>
            <Box px={2} py={0.5} borderRadius="full" bg="bg.subtle" borderWidth="1px" borderColor="border">
              <Text textStyle="xs" fontWeight="medium" color="fg">
                {order.payment_status}
              </Text>
            </Box>
          </Flex>
        </Stack>
      </Flex>

      {awaitingPaymentConfirmation && (
        <Alert.Root status="warning" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Payment proof submitted</Alert.Title>
            <Alert.Description textStyle="xs">
              The vendor is awaiting payment confirmation on their own dashboard.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {hasActiveRefundRequest && (
        <Alert.Root status="error" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Refund requested</Alert.Title>
            <Alert.Description textStyle="xs">{order.refund_reason}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
        <Stack gap={4} flex={1}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Order Details
            </Text>
            <Stack gap={3}>
              <InfoRow label="Vendor" value={order.vendor.business_name} />
              <InfoRow label="Buyer Email" value={order.buyer_email} />
              <InfoRow label="Total Amount" value={formatNaira(order.total_amount)} />
              <InfoRow label="Delivery Method" value={order.delivery_method} />
              {hasDeliveryWindow && (
                <InfoRow
                  label="Expected Delivery"
                  value={`${order.expected_delivery_start ? formatDate(order.expected_delivery_start) : '—'} to ${order.expected_delivery_end ? formatDate(order.expected_delivery_end) : '—'}`}
                />
              )}
              <InfoRow label="Created" value={formatDate(order.created_at)} />
            </Stack>
          </Box>

          {order.payment_proof_url && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Payment Proof
              </Text>
              <Box
                cursor="pointer"
                display="inline-block"
                borderRadius="md"
                overflow="hidden"
                onClick={() => setPreviewOpen(true)}
                title="Click to view full size"
              >
                <Image src={order.payment_proof_url} alt="Payment proof" maxH="320px" borderRadius="md" />
              </Box>
            </Box>
          )}

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Order Items
            </Text>
            <Stack gap={3}>
              {order.items.map((item) => (
                <Flex key={item.id} align="center" gap={3}>
                  <Box w="44px" h="44px" flexShrink={0} borderRadius="md" overflow="hidden" bg="bg.subtle" position="relative">
                    {item.item_image_url && (
                      <NextImage src={item.item_image_url} alt={item.item_name} fill sizes="44px" style={{ objectFit: 'cover' }} unoptimized />
                    )}
                  </Box>
                  <Box flex={1}>
                    <Text textStyle="sm" color="fg.muted">
                      {item.item_name} × {item.quantity}
                    </Text>
                  </Box>
                  <Text textStyle="sm" color="fg">
                    {formatNaira(item.subtotal)}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Box>

          {order.review && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Buyer Review
              </Text>
              <Stack gap={2}>
                <Flex align="center" gap={1}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LuStar
                      key={i}
                      size={14}
                      fill={i < order.review!.overall_rating ? 'var(--chakra-colors-warning-fg)' : 'none'}
                      color="var(--chakra-colors-warning-fg)"
                    />
                  ))}
                  <Text textStyle="xs" color="fg.muted" ml={1}>
                    {order.review.overall_rating}/5
                  </Text>
                </Flex>
                {order.review.review_text && (
                  <Text textStyle="sm" color="fg">
                    {order.review.review_text}
                  </Text>
                )}
                {order.review.media.length > 0 && (
                  <Flex gap={2} mt={1} overflowX="auto">
                    {order.review.media.map((m) => (
                      <Box key={m.id} w="56px" h="56px" flexShrink={0} borderRadius="md" overflow="hidden" bg="bg.subtle" position="relative">
                        <NextImage src={m.media_url} alt="Review attachment" fill sizes="56px" style={{ objectFit: 'cover' }} unoptimized />
                      </Box>
                    ))}
                  </Flex>
                )}
                <Text textStyle="xs" color="fg.subtle">
                  {formatDate(order.review.created_at)}
                </Text>
              </Stack>
            </Box>
          )}
        </Stack>
      </Flex>
    </Stack>
  );
}
