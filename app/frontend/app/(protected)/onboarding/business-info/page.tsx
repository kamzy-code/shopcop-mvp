'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuBuilding2, LuCheck } from 'react-icons/lu';
import {
  businessInfoSchema,
  BusinessInfoFormData,
  PRODUCT_CATEGORIES,
  NIGERIAN_STATES,
  PAYMENT_MODEL_OPTIONS,
  REFUND_POLICY_OPTIONS,
} from '@/app/validators/vendorSchema';
import { useOnboardingStore } from '@/app/_store/onboardingStore';
import { toaster } from '@/components/ui/toaster';
import { useSubmitBusinessInfo } from '@/app/_hooks/vendor';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      textStyle="xs"
      fontWeight="semibold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="wider"
      pt={2}
    >
      {children}
    </Text>
  );
}

export default function BusinessInfoPage() {
  const router = useRouter();
  const setBusinessInfo = useOnboardingStore((s) => s.setBusinessInfo);
  const savedInfo = useOnboardingStore((s) => s.businessInfo);
  const submitMutation = useSubmitBusinessInfo();

  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    savedInfo?.subcategories || []
  );
  const [selectedPaymentModels, setSelectedPaymentModels] = useState<string[]>(
    savedInfo?.payment_models || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      business_name: savedInfo?.business_name || '',
      business_description: savedInfo?.business_description || '',
      state: savedInfo?.state || '',
      city: savedInfo?.city || '',
      street_address: savedInfo?.street_address || '',
      landmark: savedInfo?.landmark || '',
      primary_category: savedInfo?.primary_category || '',
      subcategories: savedInfo?.subcategories || [],
      bank_name: savedInfo?.bank_name || '',
      account_number: savedInfo?.account_number || '',
      account_name: savedInfo?.account_name || '',
      payment_models: (savedInfo?.payment_models as BusinessInfoFormData['payment_models']) || [],
      refund_policy_type: (savedInfo?.refund_policy_type as BusinessInfoFormData['refund_policy_type']) || 'NO_REFUNDS',
      refund_duration_days: savedInfo?.refund_duration_days,
    },
  });

  const selectedPrimaryCategory = watch('primary_category');
  const selectedRefundPolicy = watch('refund_policy_type');
  const descriptionValue = watch('business_description') || '';

  const toggleSubcategory = (cat: string) => {
    const next = selectedSubcategories.includes(cat)
      ? selectedSubcategories.filter((c) => c !== cat)
      : selectedSubcategories.length < 3
        ? [...selectedSubcategories, cat]
        : selectedSubcategories;
    setSelectedSubcategories(next);
    setValue('subcategories', next, { shouldValidate: true });
  };

  const togglePaymentModel = (model: string) => {
    const next = selectedPaymentModels.includes(model)
      ? selectedPaymentModels.filter((m) => m !== model)
      : [...selectedPaymentModels, model];
    setSelectedPaymentModels(next);
    setValue('payment_models', next as BusinessInfoFormData['payment_models'], { shouldValidate: true });
  };

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save business info';
      toaster.create({ title: 'Error', description: message, type: 'error' });
      return;
    }

    setBusinessInfo({
      ...data,
      landmark: data.landmark || undefined,
      refund_duration_days: data.refund_duration_days,
    });
    router.push('/onboarding/nin');
  };

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      p={{ base: 6, sm: 8 }}
      shadow="lg"
    >
      <Stack gap={1} mb={8}>
        <Flex
          w={10}
          h={10}
          borderRadius="xl"
          bg="primary.subtle"
          align="center"
          justify="center"
          mb={2}
        >
          <LuBuilding2 size={20} color="var(--chakra-colors-primary-600)" />
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          Business Information
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Tell us about your business so buyers can find and trust you.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          {/* ── Business Details ── */}
          <SectionLabel>Business Details</SectionLabel>

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

          {/* ── Location ── */}
          <SectionLabel>Location</SectionLabel>

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
                _focus={{ outline: 'none', borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
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

          {/* ── Category ── */}
          <SectionLabel>Category</SectionLabel>

          <Field.Root invalid={!!errors.primary_category} required>
            <Field.Label color="fg">Primary Category</Field.Label>
            <Flex gap={2} flexWrap="wrap" pt={1}>
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedPrimaryCategory === cat;
                return (
                  <Flex
                    key={cat}
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue('primary_category', cat, { shouldValidate: true })}
                    onKeyDown={(e) => e.key === 'Enter' && setValue('primary_category', cat, { shouldValidate: true })}
                    align="center"
                    gap={1.5}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor={isSelected ? 'primary.500' : 'border'}
                    bg={isSelected ? 'primary.subtle' : 'transparent'}
                    color={isSelected ? 'primary.fg' : 'fg.muted'}
                    cursor="pointer"
                    transition="all 0.15s"
                    fontWeight={isSelected ? 'medium' : 'normal'}
                    userSelect="none"
                    _hover={{ borderColor: 'primary.400', color: 'fg' }}
                  >
                    {isSelected && <LuCheck size={12} />}
                    <Text textStyle="xs">{cat}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Field.ErrorText>{errors.primary_category?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.subcategories} required>
            <Field.Label color="fg">
              Subcategories{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">(select up to 3)</Text>
            </Field.Label>
            <Flex gap={2} flexWrap="wrap" pt={1}>
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedSubcategories.includes(cat);
                const isDisabled = !isSelected && selectedSubcategories.length >= 3;
                return (
                  <Flex
                    key={cat}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isDisabled && toggleSubcategory(cat)}
                    onKeyDown={(e) => e.key === 'Enter' && !isDisabled && toggleSubcategory(cat)}
                    align="center"
                    gap={1.5}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor={isSelected ? 'primary.500' : 'border'}
                    bg={isSelected ? 'primary.subtle' : 'transparent'}
                    color={isSelected ? 'primary.fg' : 'fg.muted'}
                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
                    opacity={isDisabled ? 0.4 : 1}
                    transition="all 0.15s"
                    fontWeight={isSelected ? 'medium' : 'normal'}
                    userSelect="none"
                    _hover={isDisabled ? {} : { borderColor: 'primary.400', color: 'fg' }}
                  >
                    {isSelected && <LuCheck size={12} />}
                    <Text textStyle="xs">{cat}</Text>
                  </Flex>
                );
              })}
            </Flex>
            {selectedSubcategories.length > 0 && (
              <Text textStyle="xs" color="fg.muted">{selectedSubcategories.length} of 3 selected</Text>
            )}
            <Field.ErrorText>{errors.subcategories?.message}</Field.ErrorText>
          </Field.Root>

          {/* ── Payment & Banking ── */}
          <SectionLabel>Payment &amp; Banking</SectionLabel>

          <Field.Root invalid={!!errors.bank_name} required>
            <Field.Label color="fg">Bank Name</Field.Label>
            <Input
              {...register('bank_name')}
              placeholder="e.g. First Bank of Nigeria"
              size="lg"
              colorPalette="primary"
            />
            <Field.ErrorText>{errors.bank_name?.message}</Field.ErrorText>
          </Field.Root>

          <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
            <Field.Root invalid={!!errors.account_number} required flex={1}>
              <Field.Label color="fg">Account Number</Field.Label>
              <Input
                {...register('account_number')}
                placeholder="10-digit account number"
                size="lg"
                colorPalette="primary"
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <Field.ErrorText>{errors.account_number?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.account_name} required flex={1}>
              <Field.Label color="fg">Account Name</Field.Label>
              <Input
                {...register('account_name')}
                placeholder="As shown on bank records"
                size="lg"
                colorPalette="primary"
              />
              <Field.ErrorText>{errors.account_name?.message}</Field.ErrorText>
            </Field.Root>
          </Flex>

          <Field.Root invalid={!!errors.payment_models} required>
            <Field.Label color="fg">Accepted Payment Methods</Field.Label>
            <Flex gap={2} flexWrap="wrap" pt={1}>
              {PAYMENT_MODEL_OPTIONS.map(({ value, label }) => {
                const isSelected = selectedPaymentModels.includes(value);
                return (
                  <Flex
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => togglePaymentModel(value)}
                    onKeyDown={(e) => e.key === 'Enter' && togglePaymentModel(value)}
                    align="center"
                    gap={1.5}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor={isSelected ? 'primary.500' : 'border'}
                    bg={isSelected ? 'primary.subtle' : 'transparent'}
                    color={isSelected ? 'primary.fg' : 'fg.muted'}
                    cursor="pointer"
                    transition="all 0.15s"
                    fontWeight={isSelected ? 'medium' : 'normal'}
                    userSelect="none"
                    _hover={{ borderColor: 'primary.400', color: 'fg' }}
                  >
                    {isSelected && <LuCheck size={12} />}
                    <Text textStyle="xs">{label}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Field.ErrorText>{errors.payment_models?.message}</Field.ErrorText>
          </Field.Root>

          {/* ── Refund Policy ── */}
          <SectionLabel>Refund Policy</SectionLabel>

          <Field.Root invalid={!!errors.refund_policy_type} required>
            <Field.Label color="fg">Refund Policy</Field.Label>
            <Flex gap={2} flexWrap="wrap" pt={1}>
              {REFUND_POLICY_OPTIONS.map(({ value, label }) => {
                const isSelected = selectedRefundPolicy === value;
                return (
                  <Flex
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue('refund_policy_type', value, { shouldValidate: true })}
                    onKeyDown={(e) => e.key === 'Enter' && setValue('refund_policy_type', value, { shouldValidate: true })}
                    align="center"
                    gap={1.5}
                    px={3}
                    py={1.5}
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor={isSelected ? 'primary.500' : 'border'}
                    bg={isSelected ? 'primary.subtle' : 'transparent'}
                    color={isSelected ? 'primary.fg' : 'fg.muted'}
                    cursor="pointer"
                    transition="all 0.15s"
                    fontWeight={isSelected ? 'medium' : 'normal'}
                    userSelect="none"
                    _hover={{ borderColor: 'primary.400', color: 'fg' }}
                  >
                    {isSelected && <LuCheck size={12} />}
                    <Text textStyle="xs">{label}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Field.ErrorText>{errors.refund_policy_type?.message}</Field.ErrorText>
          </Field.Root>

          {selectedRefundPolicy && selectedRefundPolicy !== 'NO_REFUNDS' && (
            <Field.Root invalid={!!errors.refund_duration_days}>
              <Field.Label color="fg">
                Refund Window{' '}
                <Text as="span" color="fg.muted" fontWeight="normal">(optional, in days)</Text>
              </Field.Label>
              <Input
                {...register('refund_duration_days', { valueAsNumber: true })}
                type="number"
                placeholder="e.g. 7"
                size="lg"
                colorPalette="primary"
                min={1}
                max={90}
              />
              <Field.HelperText color="fg.subtle" textStyle="xs">
                Number of days buyers have to request a refund (1–90).
              </Field.HelperText>
              <Field.ErrorText>{errors.refund_duration_days?.message}</Field.ErrorText>
            </Field.Root>
          )}

          <Button
            type="submit"
            colorPalette="primary"
            size="lg"
            w="full"
            loading={isSubmitting || submitMutation.isPending}
            disabled={isSubmitting || submitMutation.isPending}
          >
            Continue to NIN Verification
            <LuArrowRight />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => router.push('/onboarding/personal-info')}
          >
            <LuArrowLeft size={14} />
            Back to Personal Info
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
