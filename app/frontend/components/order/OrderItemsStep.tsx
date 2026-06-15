'use client';
import { Box, Button, Flex, Grid, Field, Input, Stack, Text } from '@chakra-ui/react';
import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from 'react-hook-form';
import { LuPackage, LuPlus, LuTrash2 } from 'react-icons/lu';
import { OrderFormData } from '@/app/validators/orderSchema';
import { formatCurrency } from '@/app/_lib/orderHelpers';

interface OrderItemsStepProps {
  fields: UseFieldArrayReturn<OrderFormData, 'items'>['fields'];
  register: UseFormRegister<OrderFormData>;
  errors: FieldErrors<OrderFormData>;
  watchItems: OrderFormData['items'];
  subtotal: number;
  products: unknown[];
  onRemove: (index: number) => void;
  onAppend: (value: OrderFormData['items'][number]) => void;
  onOpenCatalog: () => void;
}

export function OrderItemsStep({
  fields,
  register,
  errors,
  watchItems,
  subtotal,
  products,
  onRemove,
  onAppend,
  onOpenCatalog,
}: OrderItemsStepProps) {
  return (
    <Stack gap={4}>
      {errors.items?.root && (
        <Box bg="red.subtle" borderRadius="lg" px={3} py={2}>
          <Text textStyle="xs" color="red.600" _dark={{ color: 'red.400' }}>
            {errors.items.root.message}
          </Text>
        </Box>
      )}

      {fields.length > 0 && (
        <Stack gap={3}>
          {fields.map((field, index) => (
            <Box
              key={field.id}
              p={3}
              bg="bg.subtle"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border"
            >
              <Flex align="flex-start" gap={2} mb={2}>
                <Text textStyle="xs" color="fg.muted" pt={0.5} flexShrink={0}>
                  #{index + 1}
                </Text>
                <Stack gap={2} flex={1}>
                  <Grid templateColumns="1fr auto" gap={2}>
                    <Field.Root invalid={!!errors.items?.[index]?.item_name}>
                      <Field.Label>Item Name</Field.Label>
                      <Input
                        {...register(`items.${index}.item_name`)}
                        placeholder="Item name"
                        size="sm"
                      />
                      {errors.items?.[index]?.item_name && (
                        <Field.ErrorText>
                          {errors.items[index].item_name?.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      colorPalette="red"
                      onClick={() => onRemove(index)}
                    >
                      <LuTrash2 size={14} />
                    </Button>
                  </Grid>
                  <Grid templateColumns="1fr 1fr" gap={2}>
                    <Field.Root invalid={!!errors.items?.[index]?.item_price}>
                      <Field.Label>Price (₦)</Field.Label>
                      <Input
                        {...register(`items.${index}.item_price`, { valueAsNumber: true })}
                        placeholder="0"
                        size="sm"
                        type="number"
                        min={1}
                      />
                      {errors.items?.[index]?.item_price && (
                        <Field.ErrorText>
                          {errors.items[index].item_price?.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                    <Field.Root invalid={!!errors.items?.[index]?.quantity}>
                      <Field.Label>Quantity</Field.Label>
                      <Input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="1"
                        size="sm"
                        type="number"
                        min={1}
                      />
                      {errors.items?.[index]?.quantity && (
                        <Field.ErrorText>
                          {errors.items[index].quantity?.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </Grid>
                  <Field.Root>
                    <Field.Label>
                      Description{' '}
                      <Text as="span" color="fg.muted" textStyle="xs">
                        (optional)
                      </Text>
                    </Field.Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Size, colour, notes, etc."
                      size="sm"
                    />
                  </Field.Root>
                </Stack>
              </Flex>
              {watchItems[index] && (
                <Flex justify="flex-end">
                  <Text textStyle="xs" color="primary.fg" fontWeight="semibold">
                    Subtotal:{' '}
                    {formatCurrency(
                      (Number(watchItems[index]?.item_price) || 0) *
                        (Number(watchItems[index]?.quantity) || 0)
                    )}
                  </Text>
                </Flex>
              )}
            </Box>
          ))}
        </Stack>
      )}

      <Flex gap={2} flexWrap="wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          colorPalette="primary"
          onClick={onOpenCatalog}
          disabled={products.length === 0}
        >
          <LuPackage size={14} />
          Add from Catalog
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          colorPalette="gray"
          onClick={() =>
            onAppend({
              product_id: undefined,
              item_name: '',
              item_price: 0,
              quantity: 1,
              description: '',
            })
          }
        >
          <LuPlus size={14} />
          Add Manual Item
        </Button>
      </Flex>

      {fields.length > 0 && (
        <Flex justify="space-between" p={3} bg="primary.subtle" borderRadius="lg">
          <Text textStyle="sm" color="primary.fg" fontWeight="medium">
            Items Subtotal
          </Text>
          <Text textStyle="sm" color="primary.fg" fontWeight="bold">
            {formatCurrency(subtotal)}
          </Text>
        </Flex>
      )}
    </Stack>
  );
}
