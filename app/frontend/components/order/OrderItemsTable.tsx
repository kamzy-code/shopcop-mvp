import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { LuPackage } from 'react-icons/lu';
import { Order, OrderItem } from '@/app/_types';
import { formatCurrency, isVideoUrl } from '@/app/_lib/orderHelpers';

export function OrderItemsTable({
  tx,
  onItemClick,
}: {
  tx: Order;
  onItemClick: (item: OrderItem) => void;
}) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
      <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
        ORDER ITEMS
      </Text>
      <Stack gap={3}>
        {tx.items.map((item) => (
          <Flex key={item.id} align="center" gap={3} cursor="pointer" onClick={() => onItemClick(item)}>
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
  );
}
