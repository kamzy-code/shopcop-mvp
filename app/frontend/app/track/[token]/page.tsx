'use client';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { LuCircleCheck, LuClock, LuPackage, LuStore, LuTruck } from 'react-icons/lu';
import { useTransactionByToken } from '@/app/_hooks/transaction';
import { Transaction, TransactionStatus, TransactionStatusHistoryEntry } from '@/app/_types';
import { TransactionStatusBadge } from '@/components/transaction/TransactionStatusBadge';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { formatDate, formatCurrency, formatDateTime, isVideoUrl } from '@/app/_lib/transactionHelpers';

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

function BuyerTimeline({
  status,
  statusHistory = [],
}: {
  status: TransactionStatus;
  statusHistory?: TransactionStatusHistoryEntry[];
}) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isBad = !STATUS_ORDER.includes(status);

  if (isBad) {
    const label =
      status === 'CANCELLED'
        ? 'Order Cancelled'
        : status === 'REFUND_REQUESTED'
          ? 'Refund Requested'
          : status === 'REFUND_IN_PROGRESS'
            ? 'Refund In Progress'
            : status === 'REFUNDED'
              ? 'Refunded'
              : status;

    return (
      <Box p={4} bg="red.subtle" borderRadius="xl" textAlign="center">
        <Text textStyle="md" fontWeight="semibold" color="red.700">
          {label}
        </Text>
      </Box>
    );
  }

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
                w={9}
                h={9}
                borderRadius="full"
                align="center"
                justify="center"
                bg={done ? 'primary.500' : active ? 'primary.subtle' : 'bg.subtle'}
                borderWidth="2px"
                borderColor={done ? 'primary.500' : active ? 'primary.300' : 'border'}
                flexShrink={0}
              >
                <Icon
                  size={16}
                  color={
                    done
                      ? 'white'
                      : active
                        ? 'var(--chakra-colors-primary-fg)'
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
    >
      <Flex align="center" gap={2} mb={1}>
        <LuTruck
          size={16}
          color={isLate ? 'var(--chakra-colors-orange-600)' : 'var(--chakra-colors-primary-fg)'}
        />
        <Text textStyle="sm" fontWeight="semibold" color={isLate ? 'orange.700' : 'primary.fg'}>
          {isLate ? 'Expected delivery may be delayed' : 'Expected Delivery Window'}
        </Text>
      </Flex>
      <Text textStyle="sm" color={isLate ? 'orange.600' : 'primary.fg'}>
        {formatDate(tx.expected_delivery_start)} – {formatDate(tx.expected_delivery_end)}
      </Text>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const params = useParams();
  const token = params?.token as string;
  const { data: tx, isLoading, error } = useTransactionByToken(token);

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
          {/* Order header */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Flex align="center" justify="space-between" mb={1}>
              <Text textStyle="xs" color="fg.muted" fontFamily="mono">
                {tx.reference}
              </Text>
              <TransactionStatusBadge status={tx.status} />
            </Flex>
            <Text textStyle="xs" color="fg.muted">
              {formatDateTime(tx.created_at)}
            </Text>
          </Box>

          {/* Delivery window */}
          <DeliveryBanner tx={tx} />

          {/* Status timeline */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
              ORDER STATUS
            </Text>
            <BuyerTimeline status={tx.status} statusHistory={tx.status_history} />
          </Box>

          {/* Order items */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
              YOUR ORDER
            </Text>
            <Stack gap={3}>
              {(tx.items as Transaction['items']).map((item, i) => (
                <Flex key={i} align="center" gap={3}>
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
    </Box>
  );
}
