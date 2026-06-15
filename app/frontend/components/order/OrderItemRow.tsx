'use client';
import { Box, Button, Field, Flex, Grid, Input, Stack, Text } from '@chakra-ui/react';
import { LuTrash2 } from 'react-icons/lu';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { OrderEditData } from '@/app/validators/orderSchema';

export function OrderItemRow({
  index,
  register,
  errors,
  onRemove,
}: {
  index: number;
  register: UseFormRegister<OrderEditData>;
  errors: FieldErrors<OrderEditData>;
  onRemove: (index: number) => void;
}) {
  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      bg="bg.subtle"
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
              mt={6}
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
    </Box>
  );
}
