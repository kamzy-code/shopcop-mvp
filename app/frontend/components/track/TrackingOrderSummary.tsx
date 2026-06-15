'use client';
import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { LuPackage } from 'react-icons/lu';
import { Order, OrderItem } from '@/app/_types';
import { formatCurrency, isVideoUrl } from '@/app/_lib/orderHelpers';

export function TrackingOrderSummary({
  tx,
  onSelectItem,
}: {
  tx: Order;
  onSelectItem: (item: OrderItem) => void;
}) {
  const vendor = tx.vendor as {
    whatsapp_number?: string | null;
  };

  return (
    <>
      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
        <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
          YOUR ORDER
        </Text>
        <Stack gap={3}>
          {(tx.items as Order['items']).map((item, i) => (
            <Flex key={i} align="center" gap={3} cursor="pointer" onClick={() => onSelectItem(item)}>
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
    </>
  );
}
