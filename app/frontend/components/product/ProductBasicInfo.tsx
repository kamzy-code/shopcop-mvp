'use client';
import { Field, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ProductFormData } from '@/app/validators/vendorSchema';

interface ProductBasicInfoProps {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
}

export function ProductBasicInfo({ register, errors }: ProductBasicInfoProps) {
  return (
    <Stack gap={5}>
      <Field.Root invalid={!!errors.name} required>
        <Field.Label color="fg">Product Name</Field.Label>
        <Input
          {...register('name')}
          placeholder="e.g. Samsung Galaxy A55 6GB RAM"
          size="lg"
          colorPalette="primary"
        />
        <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root invalid={!!errors.description}>
        <Field.Label color="fg">
          Description{' '}
          <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
        </Field.Label>
        <Textarea
          {...register('description')}
          placeholder="Describe your product — features, condition, specifications..."
          size="lg"
          colorPalette="primary"
          rows={4}
          resize="none"
        />
        <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
      </Field.Root>
    </Stack>
  );
}
