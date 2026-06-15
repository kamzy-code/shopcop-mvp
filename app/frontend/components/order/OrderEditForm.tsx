'use client';
import { Box, Button, Field, Flex, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import {
  UseFormRegister,
  UseFormHandleSubmit,
  FieldErrors,
  Control,
  Controller,
  FieldArrayWithId,
  useWatch,
} from 'react-hook-form';
import { OrderEditData } from '@/app/validators/orderSchema';
import { OrderItemRow } from '@/components/order/OrderItemRow';
import { formatCurrency } from '@/app/_lib/orderHelpers';

const DELIVERY_METHODS = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DISPATCH', label: 'Dispatch' },
  { value: 'WAYBILL', label: 'Waybill' },
] as const;

export function OrderEditForm({
  fields,
  register,
  handleSubmit,
  errors,
  control,
  isSubmitting,
  subtotal,
  total,
  onSubmit,
  onRemoveItem,
  onAddManualItem,
  onOpenCatalog,
  onCancel,
}: {
  fields: FieldArrayWithId<OrderEditData, 'items', 'id'>[];
  register: UseFormRegister<OrderEditData>;
  handleSubmit: UseFormHandleSubmit<OrderEditData>;
  errors: FieldErrors<OrderEditData>;
  control: Control<OrderEditData>;
  isSubmitting: boolean;
  subtotal: number;
  total: number;
  onSubmit: (data: OrderEditData) => void;
  onRemoveItem: (index: number) => void;
  onAddManualItem: () => void;
  onOpenCatalog: () => void;
  onCancel: () => void;
}) {
  const deliveryStart = useWatch({ control, name: 'expected_delivery_start' });
  const todayStr = new Date().toISOString().split('T')[0];
  const endMin = deliveryStart || todayStr;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
    >
      <Stack gap={5}>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
            ORDER ITEMS
          </Text>

          <Stack gap={3}>
            {fields.length === 0 && (
              <Flex
                align="center"
                justify="center"
                h="80px"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="border"
                borderRadius="lg"
              >
                <Text textStyle="sm" color="fg.subtle">
                  No items yet — add from catalog or manually
                </Text>
              </Flex>
            )}

            {fields.map((field, index) => (
              <OrderItemRow
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                onRemove={onRemoveItem}
              />
            ))}

            {errors.items?.root && (
              <Text textStyle="xs" color="red.500" _dark={{ color: 'red.400' }}>
                {errors.items.root.message}
              </Text>
            )}

            <Flex gap={2}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                flex={1}
                colorPalette="primary"
                onClick={onOpenCatalog}
              >
                <LuPlus size={14} />
                Add from Catalog
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                flex={1}
                colorPalette="gray"
                onClick={onAddManualItem}
              >
                <LuPlus size={14} />
                Add Manual Item
              </Button>
            </Flex>

            {fields.length > 0 && (
              <Flex justify="space-between" pt={1} borderTopWidth="1px" borderColor="border">
                <Text textStyle="sm" color="fg.muted">
                  Subtotal
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {formatCurrency(subtotal)}
                </Text>
              </Flex>
            )}
          </Stack>
        </Box>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
            DELIVERY DETAILS
          </Text>
          <Stack gap={4}>
            <Field.Root invalid={!!errors.delivery_method}>
              <Field.Label textStyle="sm" fontWeight="medium">
                Delivery Method
              </Field.Label>
              <Controller
                name="delivery_method"
                control={control}
                render={({ field }) => (
                  <Flex gap={2}>
                    {DELIVERY_METHODS.map((m) => (
                      <Button
                        key={m.value}
                        type="button"
                        size="sm"
                        flex={1}
                        variant={field.value === m.value ? 'solid' : 'outline'}
                        colorPalette={field.value === m.value ? 'primary' : 'gray'}
                        onClick={() => field.onChange(m.value)}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </Flex>
                )}
              />
              {errors.delivery_method && (
                <Field.ErrorText>{errors.delivery_method.message}</Field.ErrorText>
              )}
            </Field.Root>

            <Flex gap={3}>
              <Field.Root flex={1}>
                <Field.Label textStyle="sm" fontWeight="medium">
                  Delivery Start
                </Field.Label>
                <Input
                  type="date"
                  {...register('expected_delivery_start')}
                  min={new Date().toISOString().split('T')[0]}
                />
              </Field.Root>
              <Field.Root flex={1}>
                <Field.Label textStyle="sm" fontWeight="medium">
                  Delivery End
                </Field.Label>
                <Input
                  type="date"
                  {...register('expected_delivery_end')}
                  min={endMin}
                />
              </Field.Root>
            </Flex>
          </Stack>
        </Box>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
            PRICING
          </Text>
          <Stack gap={3}>
            <Flex gap={3}>
              <Field.Root flex={1} invalid={!!errors.delivery_fee}>
                <Field.Label textStyle="sm" fontWeight="medium">
                  Delivery Fee (₦)
                </Field.Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  {...register('delivery_fee', { valueAsNumber: true })}
                />
                {errors.delivery_fee && (
                  <Field.ErrorText>{errors.delivery_fee.message}</Field.ErrorText>
                )}
              </Field.Root>
              <Field.Root flex={1} invalid={!!errors.discount_amount}>
                <Field.Label textStyle="sm" fontWeight="medium">
                  Discount (₦)
                </Field.Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  {...register('discount_amount', { valueAsNumber: true })}
                />
                {errors.discount_amount && (
                  <Field.ErrorText>{errors.discount_amount.message}</Field.ErrorText>
                )}
              </Field.Root>
            </Flex>

            <Flex
              justify="space-between"
              pt={2}
              borderTopWidth="1px"
              borderColor="border"
              align="center"
            >
              <Text textStyle="sm" fontWeight="bold">
                Total
              </Text>
              <Text textStyle="md" fontWeight="bold" color="primary.fg">
                {formatCurrency(total)}
              </Text>
            </Flex>
          </Stack>
        </Box>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
          <Text textStyle="xs" color="fg.muted" mb={4} fontWeight="medium">
            NOTES
          </Text>
          <Stack gap={4}>
            <Field.Root invalid={!!errors.order_notes}>
              <Field.Label textStyle="sm" fontWeight="medium">
                Order Notes{' '}
                <Text as="span" color="fg.subtle" fontWeight="normal">
                  (visible to buyer)
                </Text>
              </Field.Label>
              <Textarea
                rows={3}
                placeholder="Any information the buyer should see..."
                {...register('order_notes')}
              />
            </Field.Root>
            <Field.Root invalid={!!errors.vendor_notes}>
              <Field.Label textStyle="sm" fontWeight="medium">
                Vendor Notes{' '}
                <Text as="span" color="fg.subtle" fontWeight="normal">
                  (internal only)
                </Text>
              </Field.Label>
              <Textarea
                rows={3}
                placeholder="Private notes for your reference..."
                {...register('vendor_notes')}
              />
            </Field.Root>
          </Stack>
        </Box>

        <Flex gap={3} justify="flex-end">
          <Button type="button" variant="outline" colorPalette="gray" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            colorPalette="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}
