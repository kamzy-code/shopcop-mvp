'use client';
import { Box, Field, Flex, Grid, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { OrderFormData } from '@/app/validators/orderSchema';
import { formatCurrency } from '@/app/_lib/orderHelpers';

interface OrderSummaryStepProps {
  register: UseFormRegister<OrderFormData>;
  watchItems: OrderFormData['items'];
  watchDeliveryFee: number;
  watchDiscount: number;
  subtotal: number;
  total: number;
}

export function OrderSummaryStep({
  register,
  watchItems,
  watchDeliveryFee,
  watchDiscount,
  subtotal,
  total,
}: OrderSummaryStepProps) {
  return (
    <Stack gap={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
        <Field.Root>
          <Field.Label>
            Delivery Fee (₦){' '}
            <Text as="span" color="fg.muted" textStyle="xs">
              (optional)
            </Text>
          </Field.Label>
          <Input
            {...register('delivery_fee', { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
          />
        </Field.Root>
        <Field.Root>
          <Field.Label>
            Discount (₦){' '}
            <Text as="span" color="fg.muted" textStyle="xs">
              (optional)
            </Text>
          </Field.Label>
          <Input
            {...register('discount_amount', { valueAsNumber: true })}
            type="number"
            min={0}
            placeholder="0"
          />
        </Field.Root>
      </Grid>

      <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border">
        <Stack gap={2}>
          <Flex justify="space-between">
            <Text textStyle="sm" color="fg.muted">
              Items subtotal
            </Text>
            <Text textStyle="sm" color="fg">
              {formatCurrency(subtotal)}
            </Text>
          </Flex>
          {Number(watchDeliveryFee) > 0 && (
            <Flex justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                Delivery fee
              </Text>
              <Text textStyle="sm" color="fg">
                +{formatCurrency(Number(watchDeliveryFee))}
              </Text>
            </Flex>
          )}
          {Number(watchDiscount) > 0 && (
            <Flex justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                Discount
              </Text>
              <Text textStyle="sm" color="green.600" _dark={{ color: 'green.400' }}>
                −{formatCurrency(Number(watchDiscount))}
              </Text>
            </Flex>
          )}
          <Box borderTopWidth="1px" borderColor="border" pt={2}>
            <Flex justify="space-between">
              <Text textStyle="md" fontWeight="bold" color="fg">
                Total
              </Text>
              <Text textStyle="md" fontWeight="bold" color="primary.fg">
                {formatCurrency(total)}
              </Text>
            </Flex>
          </Box>
        </Stack>
      </Box>

      <Field.Root>
        <Field.Label>
          Order Notes (visible to buyer){' '}
          <Text as="span" color="fg.muted" textStyle="xs">
            (optional)
          </Text>
        </Field.Label>
        <Textarea
          {...register('order_notes')}
          placeholder="Any notes you'd like the buyer to see..."
          rows={2}
        />
      </Field.Root>

      <Field.Root>
        <Field.Label>
          Vendor Notes (internal only){' '}
          <Text as="span" color="fg.muted" textStyle="xs">
            (optional)
          </Text>
        </Field.Label>
        <Textarea
          {...register('vendor_notes')}
          placeholder="Private notes for yourself..."
          rows={2}
        />
      </Field.Root>

      <Box>
        <Text textStyle="sm" fontWeight="medium" color="fg" mb={2}>
          {watchItems.length} {watchItems.length === 1 ? 'item' : 'items'}
        </Text>
        <Stack gap={1}>
          {watchItems.map((item, i) => (
            <Flex key={i} justify="space-between" align="center">
              <Text textStyle="xs" color="fg.muted" truncate flex={1}>
                {item.item_name} {item.description ? `(${item.description})` : ''} ×{' '}
                {item.quantity}
              </Text>
              <Text textStyle="xs" color="fg" fontWeight="medium" ml={3} flexShrink={0}>
                {formatCurrency(
                  (Number(item.item_price) || 0) * (Number(item.quantity) || 0)
                )}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
