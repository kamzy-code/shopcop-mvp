import { Field, Flex, Input, Text, Textarea } from '@chakra-ui/react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { BusinessInfoFormData } from '@/app/validators/vendorSchema';
import { SectionHeader } from '../shared/formCard';

interface BusinessDetailsFormProps {
  register: UseFormRegister<BusinessInfoFormData>;
  errors: FieldErrors<BusinessInfoFormData>;
  descriptionValue: string;
}

export function BusinessDetailsForm({ register, errors, descriptionValue }: BusinessDetailsFormProps) {
  return (
    <>
     <SectionHeader title="Business Identity" description="Your brand name and a short pitch that tells buyers what you offer." />
      <Field.Root invalid={!!errors.business_name} required>
        <Field.Label color="fg">Business Name</Field.Label>
        <Input
          {...register('business_name')}
          placeholder="e.g. Chimere Electronics"
          size="lg"
          colorPalette="primary"
        />
        <Field.ErrorText>{errors.business_name?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root invalid={!!errors.business_description} required>
        <Field.Label color="fg">Business Description</Field.Label>
        <Textarea
          {...register('business_description')}
          placeholder="Tell buyers what you sell and what makes your business special... (minimum 50 characters)"
          size="lg"
          colorPalette="primary"
          rows={4}
          resize="none"
        />
        <Flex justify="space-between">
          <Field.ErrorText>{errors.business_description?.message}</Field.ErrorText>
          <Text textStyle="xs" color="fg.subtle" ml="auto">
            {descriptionValue.length}/500
          </Text>
        </Flex>
      </Field.Root>
    </>
  );
}
