'use client';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LuArrowLeft, LuArrowRight, LuBuilding2 } from 'react-icons/lu';
import { FormCard, SectionHeader } from '@/components/shared/formCard';
import {
  businessInfoSchema,
  BusinessInfoFormData,
  CONTACT_OPTIONS,
} from '@/app/validators/vendorSchema';
import { AlertModal } from '@/components/ui/alert-modal';
import {
  useSubmitBusinessInfo,
  useProfileCompleteness,
  useGetCategories,
} from '@/app/_hooks/vendor';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { useState } from 'react';
import { BusinessDetailsForm } from '@/components/onboarding/BusinessDetailsForm';
import { BusinessAddressForm } from '@/components/onboarding/BusinessAddressForm';
import { BusinessCategoryPicker } from '@/components/onboarding/BusinessCategoryPicker';
import { BusinessPaymentRefundForm } from '@/components/onboarding/BusinessPaymentRefundForm';
import { BusinessContactSocialsForm } from '@/components/onboarding/BusinessContactSocialsForm';

export default function BusinessInfoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNavigating = useRef(false);
  const submitMutation = useSubmitBusinessInfo();
  const { data: completeness } = useProfileCompleteness();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetCategories();

  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({
    open: false,
    description: '',
  });

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
      refund_conditions: [],
      refund_custom_notes: '',
      instagram_handle: '',
      tiktok_handle: '',
      facebook_url: '',
      whatsapp_number: '',
      primary_contact: undefined,
    },
  });

  const selectedPrimaryCategory = watch('primary_category');
  const selectedSubcategories = watch('subcategories') || [];
  const selectedPaymentModels = watch('payment_models') || [];
  const selectedRefundPolicy = watch('refund_policy_type');
  const selectedConditions = watch('refund_conditions') || [];
  const descriptionValue = watch('business_description') || '';
  const notesValue = watch('refund_custom_notes') || '';

  const instagramValue = watch('instagram_handle') || '';
  const tiktokValue = watch('tiktok_handle') || '';
  const facebookValue = watch('facebook_url') || '';
  const whatsappValue = watch('whatsapp_number') || '';
  const currentPrimaryContact = watch('primary_contact');

  const availableContactOptions = CONTACT_OPTIONS.filter((o) => {
    if (o.value === 'INSTAGRAM') return !!instagramValue.trim();
    if (o.value === 'TIKTOK') return !!tiktokValue.trim();
    if (o.value === 'FACEBOOK') return !!facebookValue.trim();
    if (o.value === 'WHATSAPP') return !!whatsappValue.trim();
    if (o.value === 'PHONE_CALL') return true;
    return false;
  });

  useEffect(() => {
    if (
      currentPrimaryContact &&
      !availableContactOptions.some((o) => o.value === currentPrimaryContact)
    ) {
      setValue('primary_contact', undefined);
    }
  }, [availableContactOptions, currentPrimaryContact, setValue]);

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save business info.';
      setErrorModal({ open: true, description: message });
      return;
    }
    isNavigating.current = true;
    await queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    router.push('/onboarding');
  };

  useEffect(() => {
    if (!isNavigating.current && completeness?.sections.business_info.completed) {
      router.replace('/onboarding');
    }
  }, [completeness, router]);

  if (!completeness) return <FullPageSpinner />;
  if (completeness.sections.business_info.completed) return null;

  return (
    <>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title="Failed to Save"
        description={errorModal.description}
        type="error"
      />
      <FormCard
        icon={<LuBuilding2 size={20} color="var(--chakra-colors-primary-600)" />}
        title="Business Information"
        description="Tell us about your business so buyers can find and trust you."
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={6}>
            <BusinessDetailsForm
              register={register}
              errors={errors}
              descriptionValue={descriptionValue}
            />

            <BusinessAddressForm register={register} errors={errors} />

            <BusinessCategoryPicker
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              selectedPrimaryCategory={selectedPrimaryCategory}
              selectedSubcategories={selectedSubcategories as string[]}
              errors={errors}
              setValue={setValue}
            />

            <BusinessPaymentRefundForm
              register={register}
              errors={errors}
              setValue={setValue}
              selectedPaymentModels={selectedPaymentModels as string[]}
              selectedRefundPolicy={selectedRefundPolicy}
              selectedConditions={selectedConditions}
              notesValue={notesValue}
            />

            <BusinessContactSocialsForm
              register={register}
              errors={errors}
              setValue={setValue}
              availableContactOptions={availableContactOptions}
              currentPrimaryContact={currentPrimaryContact}
            />

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

            <Button variant="ghost" size="sm" color="fg.muted" onClick={() => router.push('/onboarding')}>
              <LuArrowLeft size={14} />
              Back
            </Button>
          </Stack>
        </form>
      </FormCard>
    </>
  );
}
