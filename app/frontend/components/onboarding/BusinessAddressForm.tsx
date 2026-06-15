import { Box, Field, Flex, Input, Text } from '@chakra-ui/react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { BusinessInfoFormData, NIGERIAN_STATES } from '@/app/validators/vendorSchema';
import { SectionHeader } from '../shared/formCard';

interface BusinessAddressFormProps {
  register: UseFormRegister<BusinessInfoFormData>;
  errors: FieldErrors<BusinessInfoFormData>;
}

export function BusinessAddressForm({ register, errors }: BusinessAddressFormProps) {
  return (
    <>
    <SectionHeader title="Location" description="Where your business is based. This shows on your public profile." />
      <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
        <Field.Root invalid={!!errors.state} required flex={1}>
          <Field.Label color="fg">State</Field.Label>
          <Box
            as="select"
            {...register('state')}
            h="48px"
            px={3}
            borderRadius="md"
            borderWidth="1px"
            borderColor={errors.state ? 'red.500' : 'border'}
            bg="bg"
            color="fg"
            fontSize="md"
            _focus={{
              outline: 'none',
              borderColor: 'primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
            }}
          >
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Box>
          <Field.ErrorText>{errors.state?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.city} required flex={1}>
          <Field.Label color="fg">City</Field.Label>
          <Input
            {...register('city')}
            placeholder="e.g. Victoria Island"
            size="lg"
            colorPalette="primary"
          />
          <Field.ErrorText>{errors.city?.message}</Field.ErrorText>
        </Field.Root>
      </Flex>

      <Field.Root invalid={!!errors.street_address} required>
        <Field.Label color="fg">Street Address</Field.Label>
        <Input
          {...register('street_address')}
          placeholder="e.g. 12 Adeola Odeku Street"
          size="lg"
          colorPalette="primary"
        />
        <Field.ErrorText>{errors.street_address?.message}</Field.ErrorText>
      </Field.Root>

      <Field.Root invalid={!!errors.landmark}>
        <Field.Label color="fg">
          Landmark{' '}
          <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
        </Field.Label>
        <Input
          {...register('landmark')}
          placeholder="e.g. Opposite First Bank"
          size="lg"
          colorPalette="primary"
        />
        <Field.ErrorText>{errors.landmark?.message}</Field.ErrorText>
      </Field.Root>
    </>
  );
}
