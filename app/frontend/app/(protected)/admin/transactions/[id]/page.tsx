'use client';
import { use } from 'react';
import { Alert, Box, Button, Flex, Heading, Image, Spinner, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import { useAdminOrder } from '@/app/_hooks/admin';

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

export default function AdminTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: order, isLoading, isError } = useAdminOrder(id);

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

  return (
    <Stack gap={8}>
      <Button variant="ghost" size="sm" color="fg.muted" w="fit-content" px={0} onClick={() => router.push('/admin/transactions')}>
        <LuArrowLeft size={14} /> Back to Transactions
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
              <InfoRow label="Created" value={new Date(order.created_at).toLocaleString('en-NG')} />
            </Stack>
          </Box>

          {order.payment_proof_url && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Payment Proof
              </Text>
              <Image src={order.payment_proof_url} alt="Payment proof" maxH="320px" borderRadius="md" />
            </Box>
          )}

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Order Items
            </Text>
            <Stack gap={2}>
              {order.items.map((item) => (
                <Flex key={item.id} align="center" justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    {item.item_name} × {item.quantity}
                  </Text>
                  <Text textStyle="sm" color="fg">
                    {formatNaira(item.subtotal)}
                  </Text>
                </Flex>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Flex>
    </Stack>
  );
}
