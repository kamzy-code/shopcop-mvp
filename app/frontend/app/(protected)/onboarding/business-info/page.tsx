'use client';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Field, Flex, Input, Spinner, Stack, Text, Textarea } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LuArrowLeft, LuArrowRight, LuBuilding2 } from 'react-icons/lu';
import { FormCard, SectionLabel } from '@/components/shared/formCard';
import {
  businessInfoSchema,
  BusinessInfoFormData,
  NIGERIAN_STATES,
  PAYMENT_MODEL_OPTIONS,
  REFUND_POLICY_OPTIONS,
} from '@/app/validators/vendorSchema';
import { toaster } from '@/components/ui/toaster';
import { useSubmitBusinessInfo, useProfileCompleteness, useGetCategories } from '@/app/_hooks/vendor';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';

export default function BusinessInfoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNavigating = useRef(false);
  const submitMutation = useSubmitBusinessInfo();
  const { data: completeness } = useProfileCompleteness();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useGetCategories();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      business_name: '',
      business_description: '',
      state: '',
      city: '',
      street_address: '',
      landmark: '',
      primary_category: '',
      subcategories: [],
      bank_name: '',
      account_number: '',
      account_name: '',
      payment_models: [],
      refund_policy_type: 'NO_REFUNDS',
      refund_duration_days: undefined,
    },
  });

  const selectedPrimaryCategory = watch('primary_category');
  const selectedSubcategories = watch('subcategories') || [];

  // Derive subcategory options from the selected primary category
  const selectedCategoryData = categories.find((c) => c.name === selectedPrimaryCategory);
  const subcategoryOptions = selectedCategoryData?.subcategories.map((s) => ({ value: s, label: s })) ?? [];
  const selectedPaymentModels = watch('payment_models') || [];
  const selectedRefundPolicy = watch('refund_policy_type');
  const descriptionValue = watch('business_description') || '';

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save business info';
      toaster.create({ title: 'Error', description: message, type: 'error' });
      return;
    }

    isNavigating.current = true;
    await queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    router.push('/onboarding');
  };

  // Route guard — redirect if business info has already been filled.
  useEffect(() => {
    if (!isNavigating.current && completeness?.sections.business_info.completed) {
      router.replace('/onboarding');
    }
  }, [completeness, router]);

  if (!completeness) return <FullPageSpinner />;
  if (completeness.sections.business_info.completed) return null;

  return (
    <FormCard
      icon={<LuBuilding2 size={20} color="var(--chakra-colors-primary-600)" />}
      title="Business Information"
      description="Tell us about your business so buyers can find and trust you."
    >
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
                _focus={{
                  outline: 'none',
                  borderColor: 'primary.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
                }}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
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
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional)
              </Text>
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
            {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
            {categoriesError && (
              <Text color="red.fg" textStyle="xs">
                Failed to load categories. Please refresh the page.
              </Text>
            )}
            {!categoriesLoading && !categoriesError && (
              <SingleChipSelect
                options={categories.map((c) => ({ value: c.name, label: c.name }))}
                value={selectedPrimaryCategory}
                onChange={(v) => {
                  setValue('primary_category', v, { shouldValidate: true });
                  setValue('subcategories', []); // clear stale subcategory selection
                }}
              />
            )}
            <Field.ErrorText>{errors.primary_category?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.subcategories} required>
            <Field.Label color="fg">
              Subcategories{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (select up to 3)
              </Text>
            </Field.Label>
            {categoriesLoading && <Spinner size="sm" colorPalette="primary" />}
            {categoriesError && (
              <Text color="red.fg" textStyle="xs">
                Failed to load subcategories. Please refresh the page.
              </Text>
            )}
            {!categoriesLoading && !categoriesError && (
              <>
                {!selectedPrimaryCategory ? (
                  <Text color="fg.subtle" textStyle="xs">
                    Select a primary category first to see subcategories.
                  </Text>
                ) : (
                  <MultiChipSelect
                    options={subcategoryOptions}
                    value={selectedSubcategories as string[]}
                    onChange={(v) => setValue('subcategories', v, { shouldValidate: true })}
                    max={3}
                  />
                )}
              </>
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
            <MultiChipSelect
              options={[...PAYMENT_MODEL_OPTIONS]}
              value={selectedPaymentModels as string[]}
              onChange={(v) =>
                setValue('payment_models', v as BusinessInfoFormData['payment_models'], {
                  shouldValidate: true,
                })
              }
            />
            <Field.ErrorText>{errors.payment_models?.message}</Field.ErrorText>
          </Field.Root>

          {/* ── Refund Policy ── */}
          <SectionLabel>Refund Policy</SectionLabel>

          <Field.Root invalid={!!errors.refund_policy_type} required>
            <Field.Label color="fg">Refund Policy</Field.Label>
            <SingleChipSelect
              options={[...REFUND_POLICY_OPTIONS]}
              value={selectedRefundPolicy}
              onChange={(v) =>
                setValue('refund_policy_type', v as BusinessInfoFormData['refund_policy_type'], {
                  shouldValidate: true,
                })
              }
            />
            <Field.ErrorText>{errors.refund_policy_type?.message}</Field.ErrorText>
          </Field.Root>

          {selectedRefundPolicy && selectedRefundPolicy !== 'NO_REFUNDS' && (
            <Field.Root invalid={!!errors.refund_duration_days}>
              <Field.Label color="fg">
                Refund Window{' '}
                <Text as="span" color="fg.muted" fontWeight="normal">
                  (optional, in days)
                </Text>
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
            Save & Continue
            <LuArrowRight />
          </Button>

          <Button variant="ghost" size="sm" color="fg.muted" onClick={() => router.back()}>
            <LuArrowLeft size={14} />
            Back
          </Button>
        </Stack>
      </form>
    </FormCard>
  );
}
