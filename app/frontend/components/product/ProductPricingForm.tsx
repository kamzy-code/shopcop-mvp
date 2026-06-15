'use client';
import { Field, Flex, Input, Stack, Text } from '@chakra-ui/react';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { ProductFormData } from '@/app/validators/vendorSchema';

interface ProductPricingFormProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  setValue: UseFormSetValue<ProductFormData>;
  selectedStock: string;
}

export function ProductPricingForm({ register, errors, setValue, selectedStock }: ProductPricingFormProps) {
  return (
    <Stack gap={5}>
      <Field.Root invalid={!!errors.price} required>
        <Field.Label color="fg">Price (₦)</Field.Label>
        <Flex align="center" borderWidth="1px" borderColor="border" borderRadius="lg" px={4} h="48px" gap={2}>
          <Text color="fg.muted" fontWeight="medium" flexShrink={0}>₦</Text>
          <input
            {...register('price', { valueAsNumber: true })}
            type="number"
            placeholder="0"
            min={0}
            step="0.01"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '16px', color: 'inherit' }}
          />
        </Flex>
        <Field.ErrorText>{errors.price?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root required>
        <Field.Label color="fg">Stock Status</Field.Label>
        <Flex gap={3}>
          {[
            { value: 'IN_STOCK', label: 'In Stock', color: 'success' },
            { value: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'red' },
          ].map((option) => {
            const isSelected = selectedStock === option.value;
            return (
              <Flex
                key={option.value}
                role="button"
                tabIndex={0}
                flex={1}
                px={4}
                py={3}
                borderRadius="lg"
                borderWidth="1.5px"
                borderColor={isSelected ? `${option.color}.400` : 'border'}
                bg={isSelected ? `${option.color}.subtle` : 'transparent'}
                cursor="pointer"
                align="center"
                justify="center"
                transition="all 0.15s"
                userSelect="none"
                onClick={() => setValue('stock_status', option.value as 'IN_STOCK' | 'OUT_OF_STOCK', { shouldValidate: true })}
                onKeyDown={(e) => e.key === 'Enter' && setValue('stock_status', option.value as 'IN_STOCK' | 'OUT_OF_STOCK')}
                _hover={{ borderColor: `${option.color}.300` }}
              >
                <Text textStyle="sm" fontWeight={isSelected ? 'semibold' : 'normal'} color={isSelected ? `${option.color}.fg` : 'fg.muted'}>
                  {option.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Field.Root>

      <Field.Root invalid={!!errors.stock_quantity}>
        <Field.Label color="fg">
          Stock Quantity{' '}
          <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
        </Field.Label>
        <Input
          {...register('stock_quantity', {
            setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
          })}
          type="number"
          min={0}
          placeholder="e.g. 50"
          size="lg"
          colorPalette="primary"
        />
        <Field.HelperText color="fg.subtle" textStyle="xs">
          Leave blank if you are not tracking exact stock count.
        </Field.HelperText>
        <Field.ErrorText>{errors.stock_quantity?.message}</Field.ErrorText>
      </Field.Root>
    </Stack>
  );
}
