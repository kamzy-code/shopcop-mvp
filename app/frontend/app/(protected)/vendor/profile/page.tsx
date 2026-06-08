'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  LuArrowRight,
  LuBuilding2,
  LuCheck,
  LuClock,
  LuIdCard,
  LuLock,
  LuMapPin,
  LuPencil,
  LuShieldAlert,
  LuShieldCheck,
  LuStore,
  LuUser,
  LuX,
} from 'react-icons/lu';
import {
  personalInfoSchema,
  businessInfoSchema,
  BusinessInfoFormData,
  PersonalInfoFormData,
  NIGERIAN_STATES,
  PAYMENT_MODEL_OPTIONS,
  REFUND_POLICY_OPTIONS,
  REFUND_DURATION_OPTIONS,
  COMMON_REFUND_CONDITIONS,
  CONTACT_OPTIONS,
} from '@/app/validators/vendorSchema';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import {
  useVendorProfile,
  useSubmitPersonalInfo,
  useSubmitBusinessInfo,
  useGetVerifications,
  useProfileCompleteness,
  useGetCategories,
} from '@/app/_hooks/vendor';
import { AppShell } from '@/components/shared/appShell';
import { TierBadge } from '@/components/shared/tierBadge';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { SectionHeader, SectionLabel } from '@/components/shared/formCard';
import { VerificationRecord, VerificationType } from '@/app/_types';

// ── Shared helpers ────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

/** Pill-style read-only label + value row. */
function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      gap={{ base: 0.5, sm: 3 }}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottomWidth: 0 }}
    >
      <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color={value ? 'fg' : 'fg.subtle'} fontWeight={value ? 'medium' : 'normal'}>
        {value ?? '—'}
      </Text>
    </Flex>
  );
}

/** Comma-separated chips for array values. */
function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <Text textStyle="sm" color="fg.subtle">—</Text>;
  return (
    <Flex flexWrap="wrap" gap={1.5}>
      {items.map((item) => (
        <Box
          key={item}
          px={2.5}
          py={0.5}
          borderRadius="full"
          bg="primary.subtle"
          color="primary.fg"
          textStyle="xs"
          fontWeight="medium"
        >
          {item}
        </Box>
      ))}
    </Flex>
  );
}

// ── Personal Info Tab ─────────────────────────────────────────────────────────

function PersonalInfoTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useVendorProfile();
  const submitMutation = useSubmitPersonalInfo();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: undefined,
      date_of_birth: '',
      phone_number: '',
    },
  });

  const selectedGender = watch('gender');

  // Pre-fill form whenever profile loads or edit mode opens
  useEffect(() => {
    if (profile && isEditing) {
      reset({
        first_name: profile.first_name ?? '',
        middle_name: profile.middle_name ?? '',
        last_name: profile.last_name ?? '',
        gender: (profile.gender as PersonalInfoFormData['gender']) ?? undefined,
        date_of_birth: profile.date_of_birth
          ? new Date(profile.date_of_birth).toISOString().split('T')[0]
          : '',
        phone_number: profile.phone_number ?? '',
      });
    }
  }, [profile, isEditing, reset]);

  const onSubmit = async (data: PersonalInfoFormData) => {
    const payload = { ...data, middle_name: data.middle_name || undefined };
    try {
      await submitMutation.mutateAsync(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save personal info';
      setErrorModal({ open: true, description: message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    setIsEditing(false);
    toaster.create({ title: 'Saved', description: 'Personal info updated.', type: 'success' });
  };

  if (isLoading) return <Spinner size="sm" colorPalette="primary" />;

  if (!isEditing) {
    const dob = profile?.date_of_birth
      ? new Date(profile.date_of_birth).toLocaleDateString('en-NG', { dateStyle: 'medium' })
      : null;
    const genderLabel =
      GENDER_OPTIONS.find((g) => g.value === profile?.gender)?.label ?? profile?.gender ?? null;

    return (
      <Stack gap={0}>
        <Flex align="center" mb={4}>
          <Heading as="h2" textStyle="lg" fontWeight="semibold" color="fg" hideFrom="sm">
            Personal Information
          </Heading>
          <Button
            ml="auto"
            size="sm"
            variant="outline"
            colorPalette="primary"
            onClick={() => setIsEditing(true)}
          >
            <LuPencil size={13} />
            Edit
          </Button>
        </Flex>
        <FieldRow label="First Name" value={profile?.first_name} />
        <FieldRow label="Middle Name" value={profile?.middle_name} />
        <FieldRow label="Last Name" value={profile?.last_name} />
        <FieldRow label="Gender" value={genderLabel} />
        <FieldRow label="Date of Birth" value={dob} />
        <FieldRow label="Phone Number" value={profile?.phone_number} />
      </Stack>
    );
  }

  return (
    <>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title="Failed to Save"
        description={errorModal.description}
        type="error"
      />
      <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={5}>
        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={!!errors.first_name} required flex={1}>
            <Field.Label color="fg">First Name</Field.Label>
            <Input {...register('first_name')} size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.first_name?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.last_name} required flex={1}>
            <Field.Label color="fg">Last Name</Field.Label>
            <Input {...register('last_name')} size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.last_name?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Field.Root invalid={!!errors.middle_name}>
          <Field.Label color="fg">
            Middle Name{' '}
            <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
          </Field.Label>
          <Input {...register('middle_name')} size="lg" colorPalette="primary" />
          <Field.ErrorText>{errors.middle_name?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.gender} required>
          <Field.Label color="fg">Gender</Field.Label>
          <SingleChipSelect
            options={[...GENDER_OPTIONS]}
            value={selectedGender}
            onChange={(v) => setValue('gender', v as PersonalInfoFormData['gender'], { shouldValidate: true })}
            showCheck={false}
          />
          <Field.ErrorText>{errors.gender?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.date_of_birth} required>
          <Field.Label color="fg">Date of Birth</Field.Label>
          <Input
            {...register('date_of_birth')}
            type="date"
            size="lg"
            colorPalette="primary"
            max={
              new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                .toISOString()
                .split('T')[0]
            }
          />
          <Field.ErrorText>{errors.date_of_birth?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.phone_number} required>
          <Field.Label color="fg">Phone Number</Field.Label>
          <Input
            {...register('phone_number')}
            placeholder="e.g. 08012345678"
            size="lg"
            colorPalette="primary"
            type="tel"
          />
          <Field.ErrorText>{errors.phone_number?.message}</Field.ErrorText>
        </Field.Root>

        <Flex gap={3}>
          <Button
            type="submit"
            colorPalette="primary"
            size="md"
            loading={isSubmitting || submitMutation.isPending}
            disabled={isSubmitting || submitMutation.isPending}
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            color="fg.muted"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </Flex>
      </Stack>
    </form>
    </>
  );
}

// ── Business Info Tab ─────────────────────────────────────────────────────────

function BusinessInfoTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [customConditionInput, setCustomConditionInput] = useState('');
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useVendorProfile();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategories();
  const submitMutation = useSubmitBusinessInfo();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
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
    },
  });

  const selectedPrimaryCategory = watch('primary_category');
  const selectedSubcategories = watch('subcategories') || [];
  const selectedPaymentModels = watch('payment_models') || [];
  const selectedRefundPolicy = watch('refund_policy_type');
  const selectedConditions = watch('refund_conditions') || [];
  const descriptionValue = watch('business_description') || '';
  const notesValue = watch('refund_custom_notes') || '';

  // Social contact watches
  const instagramValue = watch('instagram_handle') || '';
  const tiktokValue = watch('tiktok_handle') || '';
  const facebookValue = watch('facebook_url') || '';
  const whatsappValue = watch('whatsapp_number') || '';
  const currentPrimaryContact = watch('primary_contact');

  const selectedCategoryData = categories.find((c) => c.name === selectedPrimaryCategory);
  const subcategoryOptions = selectedCategoryData?.subcategories.map((s) => ({ value: s, label: s })) ?? [];

  // Dynamic primary contact options — only show filled platforms
  const availableContactOptions = CONTACT_OPTIONS.filter((o) => {
    if (o.value === 'INSTAGRAM')  return !!instagramValue.trim();
    if (o.value === 'TIKTOK')     return !!tiktokValue.trim();
    if (o.value === 'FACEBOOK')   return !!facebookValue.trim();
    if (o.value === 'WHATSAPP')   return !!whatsappValue.trim();
    if (o.value === 'PHONE_CALL') return true;
    return false;
  });

  // Clear primary_contact if its platform is no longer filled
  useEffect(() => {
    if (
      currentPrimaryContact &&
      !availableContactOptions.some((o) => o.value === currentPrimaryContact)
    ) {
      setValue('primary_contact', undefined);
    }
  }, [availableContactOptions, currentPrimaryContact, setValue]);

  useEffect(() => {
    if (profile && isEditing) {
      reset({
        business_name: profile.business_name ?? '',
        business_description: profile.business_description ?? '',
        state: profile.state ?? '',
        city: profile.city ?? '',
        street_address: profile.street_address ?? '',
        landmark: profile.landmark ?? '',
        primary_category: profile.primary_category ?? '',
        subcategories: profile.subcategories ?? [],
        bank_name: profile.bank_name ?? '',
        account_number: profile.account_number ?? '',
        account_name: profile.account_name ?? '',
        payment_models: (profile.payment_models ?? []) as BusinessInfoFormData['payment_models'],
        refund_policy_type: profile.refund_policy_type as BusinessInfoFormData['refund_policy_type'],
        refund_duration_days: profile.refund_duration_days ?? undefined,
        refund_conditions: profile.refund_conditions ?? [],
        refund_custom_notes: profile.refund_custom_notes ?? '',
        instagram_handle: profile.instagram_handle ?? '',
        tiktok_handle: profile.tiktok_handle ?? '',
        facebook_url: profile.facebook_url ?? '',
        whatsapp_number: profile.whatsapp_number ?? '',
        primary_contact: (profile.primary_contact as BusinessInfoFormData['primary_contact']) ?? undefined,
      });
    }
  }, [profile, isEditing, reset]);

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      await submitMutation.mutateAsync(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save business info';
      setErrorModal({ open: true, description: message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['profile-completeness'] });
    setIsEditing(false);
    toaster.create({ title: 'Saved', description: 'Business info updated.', type: 'success' });
  };

  if (isLoading) return <Spinner size="sm" colorPalette="primary" />;

  if (!isEditing) {
    const refundPolicyLabel =
      REFUND_POLICY_OPTIONS.find((o) => o.value === profile?.refund_policy_type)?.label ??
      profile?.refund_policy_type ??
      null;
    const paymentModelLabels = (profile?.payment_models ?? [])
      .map((m) => PAYMENT_MODEL_OPTIONS.find((o) => o.value === m)?.label ?? m);

    return (
      <Stack gap={0}>
        <Flex align="center" mb={4}>
          <Heading as="h2" textStyle="lg" fontWeight="semibold" color="fg" hideFrom="sm">
            Business Information
          </Heading>
          <Button
            ml="auto"
            size="sm"
            variant="outline"
            colorPalette="primary"
            onClick={() => setIsEditing(true)}
          >
            <LuPencil size={13} />
            Edit
          </Button>
        </Flex>

        {/* Business Identity */}
        <Box pt={1} pb={1}>
          <SectionLabel>Business Identity</SectionLabel>
        </Box>
        <FieldRow label="Business Name" value={profile?.business_name} />
        <FieldRow label="Description" value={profile?.business_description} />

        {/* Category */}
        <Box pt={5} mt={1}>
          <SectionLabel>Category</SectionLabel>
        </Box>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 0.5, sm: 3 }}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>Primary Category</Text>
          <Text textStyle="sm" color={profile?.primary_category ? 'fg' : 'fg.subtle'} fontWeight="medium">
            {profile?.primary_category ?? '—'}
          </Text>
        </Flex>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 0.5, sm: 3 }}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>Subcategories</Text>
          <ChipList items={profile?.subcategories ?? []} />
        </Flex>

        {/* Location */}
        <Box pt={5} mt={1}>
          <SectionLabel>Location</SectionLabel>
        </Box>
        <FieldRow label="State" value={profile?.state} />
        <FieldRow label="City" value={profile?.city} />
        <FieldRow label="Street Address" value={profile?.street_address} />
        <FieldRow label="Landmark" value={profile?.landmark} />

        {/* Payment & Banking */}
        <Box pt={5} mt={1} >
          <SectionLabel>Payment &amp; Banking</SectionLabel>
        </Box>
        <FieldRow label="Bank Name" value={profile?.bank_name} />
        <FieldRow label="Account Number" value={profile?.account_number} />
        <FieldRow label="Account Name" value={profile?.account_name} />
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 0.5, sm: 3 }}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>Payment Models</Text>
          <ChipList items={paymentModelLabels} />
        </Flex>

        {/* Refund Policy */}
        <Box pt={5} mt={1} >
          <SectionLabel>Refund Policy</SectionLabel>
        </Box>
        <FieldRow label="Refund Policy" value={refundPolicyLabel} />
        {profile?.refund_duration_days && (
          <FieldRow label="Refund Window" value={`${profile.refund_duration_days} days`} />
        )}
        {(profile?.refund_conditions?.length ?? 0) > 0 && (
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            gap={{ base: 0.5, sm: 3 }}
            py={3}
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>Refund Conditions</Text>
            <Stack gap={1}>
              {(profile?.refund_conditions ?? []).map((c) => (
                <Text key={c} textStyle="sm" color="fg">• {c}</Text>
              ))}
            </Stack>
          </Flex>
        )}
        {profile?.refund_custom_notes && (
          <FieldRow label="Refund Notes" value={profile.refund_custom_notes} />
        )}

        {/* Contact & Socials */}
        <Box pt={5} mt={1}>
          <SectionLabel>Contact &amp; Socials</SectionLabel>
        </Box>
        <FieldRow label="Instagram" value={profile?.instagram_handle} />
        <FieldRow label="TikTok" value={profile?.tiktok_handle} />
        <FieldRow label="Facebook" value={profile?.facebook_url} />
        <FieldRow label="WhatsApp" value={profile?.whatsapp_number} />
        <FieldRow
          label="Primary Contact"
          value={CONTACT_OPTIONS.find((o) => o.value === profile?.primary_contact)?.label}
        />
      </Stack>
    );
  }

  // ── Edit form ────────────────────────────────────────────────────────────────
  return (
    <>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title="Failed to Save"
        description={errorModal.description}
        type="error"
      />
      <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={5}>

        {/* ── Business Identity ── */}
        <SectionHeader
          title="Business Identity"
          description="Your brand name and a short pitch that tells buyers what you offer."
        />

        <Field.Root invalid={!!errors.business_name} required>
          <Field.Label color="fg">Business Name</Field.Label>
          <Input {...register('business_name')} size="lg" colorPalette="primary" />
          <Field.ErrorText>{errors.business_name?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.business_description} required>
          <Field.Label color="fg">Business Description</Field.Label>
          <Textarea
            {...register('business_description')}
            size="lg"
            colorPalette="primary"
            rows={4}
            resize="none"
          />
          <Flex justify="space-between">
            <Field.ErrorText>{errors.business_description?.message}</Field.ErrorText>
            <Text textStyle="xs" color="fg.subtle" ml="auto">{descriptionValue.length}/500</Text>
          </Flex>
        </Field.Root>

        {/* ── Category ── */}
        <SectionHeader
          title="Category"
          description="Help buyers discover your products in the right section of the marketplace."
        />

        <Field.Root invalid={!!errors.primary_category} required>
          <Field.Label color="fg">Primary Category</Field.Label>
          {categoriesLoading ? (
            <Spinner size="sm" colorPalette="primary" />
          ) : (
            <SingleChipSelect
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
              value={selectedPrimaryCategory}
              onChange={(v) => {
                setValue('primary_category', v, { shouldValidate: true });
                setValue('subcategories', []);
              }}
            />
          )}
          <Field.ErrorText>{errors.primary_category?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.subcategories} required>
          <Field.Label color="fg">
            Subcategories{' '}
            <Text as="span" color="fg.muted" fontWeight="normal">(up to 3)</Text>
          </Field.Label>
          {!selectedPrimaryCategory ? (
            <Text color="fg.subtle" textStyle="xs">Select a primary category first.</Text>
          ) : (
            <MultiChipSelect
              options={subcategoryOptions}
              value={selectedSubcategories as string[]}
              onChange={(v) => setValue('subcategories', v, { shouldValidate: true })}
              max={3}
            />
          )}
          <Field.ErrorText>{errors.subcategories?.message}</Field.ErrorText>
        </Field.Root>

        {/* ── Location ── */}
        <SectionHeader
          title="Location"
          description="Where your business is based. This shows on your public profile."
        />

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={!!errors.state} required flex={1}>
            <Field.Label color="fg">State</Field.Label>
            <Box
              as="select"
              {...register('state')}
              h="48px" px={3} borderRadius="md" borderWidth="1px"
              borderColor={errors.state ? 'red.500' : 'border'}
              bg="bg" color="fg" fontSize="md"
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
            <Input {...register('city')} size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.city?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Field.Root invalid={!!errors.street_address} required>
          <Field.Label color="fg">Street Address</Field.Label>
          <Input {...register('street_address')} size="lg" colorPalette="primary" />
          <Field.ErrorText>{errors.street_address?.message}</Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.landmark}>
          <Field.Label color="fg">
            Landmark <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
          </Field.Label>
          <Input {...register('landmark')} size="lg" colorPalette="primary" />
        </Field.Root>

        {/* ── Payment & Banking ── */}
        <SectionHeader
          title="Payment & Banking"
          description="Your bank details for receiving payouts and the payment types you accept from buyers."
        />

        <Field.Root invalid={!!errors.bank_name} required>
          <Field.Label color="fg">Bank Name</Field.Label>
          <Input {...register('bank_name')} size="lg" colorPalette="primary" />
          <Field.ErrorText>{errors.bank_name?.message}</Field.ErrorText>
        </Field.Root>

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={!!errors.account_number} required flex={1}>
            <Field.Label color="fg">Account Number</Field.Label>
            <Input {...register('account_number')} size="lg" colorPalette="primary" maxLength={10} inputMode="numeric" />
            <Field.ErrorText>{errors.account_number?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.account_name} required flex={1}>
            <Field.Label color="fg">Account Name</Field.Label>
            <Input {...register('account_name')} size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.account_name?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Field.Root invalid={!!errors.payment_models} required>
          <Field.Label color="fg">Accepted Payment Methods</Field.Label>
          <MultiChipSelect
            options={[...PAYMENT_MODEL_OPTIONS]}
            value={selectedPaymentModels as string[]}
            onChange={(v) =>
              setValue('payment_models', v as BusinessInfoFormData['payment_models'], { shouldValidate: true })
            }
          />
          <Field.ErrorText>{errors.payment_models?.message}</Field.ErrorText>
        </Field.Root>

        {/* ── Refund Policy ── */}
        <SectionHeader
          title="Refund Policy"
          description="Set clear expectations for buyers about returns and exchanges."
        />

        <Field.Root invalid={!!errors.refund_policy_type} required>
          <Field.Label color="fg">Refund Policy</Field.Label>
          <SingleChipSelect
            options={[...REFUND_POLICY_OPTIONS]}
            value={selectedRefundPolicy}
            onChange={(v) =>
              setValue('refund_policy_type', v as BusinessInfoFormData['refund_policy_type'], { shouldValidate: true })
            }
          />
          <Field.ErrorText>{errors.refund_policy_type?.message}</Field.ErrorText>
        </Field.Root>

        {selectedRefundPolicy && selectedRefundPolicy !== 'NO_REFUNDS' && (
          <>
            <Field.Root invalid={!!errors.refund_duration_days}>
              <Field.Label color="fg">
                Refund Window <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
              </Field.Label>
              <Box
                as="select"
                {...register('refund_duration_days', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
                h="48px" px={3} borderRadius="md" borderWidth="1px"
                borderColor={errors.refund_duration_days ? 'red.500' : 'border'}
                bg="bg" color="fg" fontSize="md"
                _focus={{ outline: 'none', borderColor: 'primary.500', boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)' }}
              >
                <option value="">Select refund window</option>
                {REFUND_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Box>
              <Field.ErrorText>{errors.refund_duration_days?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.refund_conditions}>
              <Field.Label color="fg">
                Refund Conditions <Text as="span" color="fg.muted" fontWeight="normal">(optional, up to 10)</Text>
              </Field.Label>
              <Stack gap={2} mt={1}>
                {COMMON_REFUND_CONDITIONS.map((condition) => {
                  const isChecked = selectedConditions.includes(condition);
                  return (
                    <Box key={condition} as="label" display="flex" alignItems="center" gap={2} cursor="pointer" color="fg" fontSize="sm">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? selectedConditions.filter((c) => c !== condition)
                            : selectedConditions.length < 10
                            ? [...selectedConditions, condition]
                            : selectedConditions;
                          setValue('refund_conditions', next, { shouldValidate: true });
                        }}
                        style={{ accentColor: 'var(--chakra-colors-primary-500)', width: '1rem', height: '1rem', flexShrink: 0, cursor: 'pointer' }}
                      />
                      {condition}
                    </Box>
                  );
                })}
              </Stack>
              {selectedConditions
                .filter((c) => !(COMMON_REFUND_CONDITIONS as readonly string[]).includes(c))
                .map((custom) => (
                  <Flex key={custom} align="center" gap={2} mt={2} px={3} py={2} borderRadius="md" borderWidth="1px" borderColor="border" bg="bg.subtle">
                    <Text fontSize="sm" color="fg" flex={1}>{custom}</Text>
                    <Button
                      type="button" size="xs" variant="ghost" color="fg.muted"
                      onClick={() => setValue('refund_conditions', selectedConditions.filter((c) => c !== custom), { shouldValidate: true })}
                      aria-label="Remove condition"
                    >×</Button>
                  </Flex>
                ))}
              {selectedConditions.length < 10 && (
                <Flex gap={2} mt={2}>
                  <Input
                    value={customConditionInput}
                    onChange={(e) => setCustomConditionInput(e.target.value)}
                    placeholder="Add a custom condition..."
                    size="md" colorPalette="primary" maxLength={200}
                  />
                  <Button
                    type="button" colorPalette="primary" variant="outline" size="md" flexShrink={0}
                    disabled={!customConditionInput.trim()}
                    onClick={() => {
                      const trimmed = customConditionInput.trim();
                      if (!trimmed || selectedConditions.length >= 10) return;
                      setValue('refund_conditions', [...selectedConditions, trimmed], { shouldValidate: true });
                      setCustomConditionInput('');
                    }}
                  >Add</Button>
                </Flex>
              )}
              <Field.ErrorText>{errors.refund_conditions?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.refund_custom_notes}>
              <Field.Label color="fg">
                Additional Notes <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
              </Field.Label>
              <Textarea {...register('refund_custom_notes')} size="lg" colorPalette="primary" rows={3} resize="none"
                placeholder="Any additional details about your refund process..." />
              <Flex justify="space-between">
                <Field.ErrorText>{errors.refund_custom_notes?.message}</Field.ErrorText>
                <Text textStyle="xs" color="fg.subtle" ml="auto">{notesValue.length}/500</Text>
              </Flex>
            </Field.Root>
          </>
        )}

        {/* ── Contact & Socials ── */}
        <SectionHeader
          title="Contact & Socials"
          description="At least one contact is required so buyers can reach you. Fill in the ones you use and pick which is primary."
        />

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={!!errors.instagram_handle} flex={1}>
            <Field.Label color="fg">Instagram <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text></Field.Label>
            <Input {...register('instagram_handle')} placeholder="https://instagram.com/..." size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.instagram_handle?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.tiktok_handle} flex={1}>
            <Field.Label color="fg">TikTok <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text></Field.Label>
            <Input {...register('tiktok_handle')} placeholder="https://tiktok.com/@..." size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.tiktok_handle?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
          <Field.Root invalid={!!errors.facebook_url} flex={1}>
            <Field.Label color="fg">Facebook <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text></Field.Label>
            <Input {...register('facebook_url')} placeholder="https://facebook.com/..." size="lg" colorPalette="primary" />
            <Field.ErrorText>{errors.facebook_url?.message}</Field.ErrorText>
          </Field.Root>
          <Field.Root invalid={!!errors.whatsapp_number} flex={1}>
            <Field.Label color="fg">WhatsApp <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text></Field.Label>
            <Input {...register('whatsapp_number')} placeholder="08012345678" size="lg" colorPalette="primary" type="tel" />
            <Field.ErrorText>{errors.whatsapp_number?.message}</Field.ErrorText>
          </Field.Root>
        </Flex>

        {availableContactOptions.length > 0 && (
          <Field.Root invalid={!!errors.primary_contact}>
            <Field.Label color="fg">
              Primary Contact <Text as="span" color="fg.muted" fontWeight="normal">(optional)</Text>
            </Field.Label>
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Which channel should buyers use to contact you first?
            </Field.HelperText>
            <SingleChipSelect
              options={availableContactOptions.map((o) => ({ value: o.value, label: o.label }))}
              value={currentPrimaryContact ?? ''}
              onChange={(v) => setValue('primary_contact', v as BusinessInfoFormData['primary_contact'], { shouldValidate: true })}
            />
            <Field.ErrorText>{errors.primary_contact?.message}</Field.ErrorText>
          </Field.Root>
        )}

        <Flex gap={3}>
          <Button
            type="submit"
            colorPalette="primary"
            size="md"
            loading={isSubmitting || submitMutation.isPending}
            disabled={isSubmitting || submitMutation.isPending}
          >
            Save Changes
          </Button>
          <Button type="button" variant="ghost" size="md" color="fg.muted" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </Flex>
      </Stack>
    </form>
    </>
  );
}

// ── Verifications Tab ─────────────────────────────────────────────────────────

const TIER_THRESHOLDS = [
  { tier: 'TIER_0', min: 0, max: 9 },
  { tier: 'TIER_1', min: 10, max: 14 },
  { tier: 'TIER_2', min: 15, max: 22 },
  { tier: 'TIER_3', min: 23, max: 29 },
  { tier: 'TIER_4', min: 30, max: Infinity },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'cac', label: 'CAC Certificate (+15 pts) — Registered company' },
  { value: 'smedan', label: 'SMEDAN Certificate (+8 pts) — Small/medium enterprise' },
];

function statusIcon(record: VerificationRecord | undefined, locked: boolean) {
  if (locked) return <LuLock size={16} />;
  if (!record) return <LuShieldAlert size={16} />;
  if (record.status === 'APPROVED') return <LuShieldCheck size={16} />;
  if (record.status === 'PENDING') return <LuClock size={16} />;
  return <LuX size={16} />;
}
function statusColor(record: VerificationRecord | undefined, locked: boolean) {
  if (locked || !record) return 'fg.muted';
  if (record.status === 'APPROVED') return 'success.fg';
  if (record.status === 'PENDING') return 'warning.fg';
  return 'red.600';
}
function statusLabel(record: VerificationRecord | undefined, locked: boolean) {
  if (locked) return 'Locked';
  if (!record) return 'Not Started';
  if (record.status === 'APPROVED') return 'Approved';
  if (record.status === 'PENDING') return 'Under Review';
  return 'Rejected';
}
function statusBg(record: VerificationRecord | undefined, locked: boolean) {
  if (locked || !record) return 'bg.subtle';
  if (record.status === 'APPROVED') return 'success.subtle';
  if (record.status === 'PENDING') return 'warning.subtle';
  return 'red.subtle';
}

function VerificationCard({
  icon: Icon, title, points, record, locked, children,
}: {
  icon: React.ElementType; title: string; points: string;
  record: VerificationRecord | undefined; locked: boolean; children?: React.ReactNode;
}) {
  const color = statusColor(record, locked);
  const bg = statusBg(record, locked);
  const label = statusLabel(record, locked);

  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex align="flex-start" justify="space-between" mb={3} gap={3}>
        <Flex align="center" gap={3}>
          <Flex w={10} h={10} borderRadius="lg" bg="primary.subtle" align="center" justify="center" color="primary.fg" flexShrink={0}>
            <Icon size={18} />
          </Flex>
          <Box>
            <Text fontWeight="semibold" color="fg" textStyle="sm">{title}</Text>
            <Text textStyle="xs" color="fg.muted">{points}</Text>
          </Box>
        </Flex>
        <Flex align="center" gap={1.5} px={2.5} py={1} borderRadius="full" bg={bg} color={color} flexShrink={0}>
          {statusIcon(record, locked)}
          <Text textStyle="xs" fontWeight="medium">{label}</Text>
        </Flex>
      </Flex>
      {record?.status === 'REJECTED' && record.rejection_reason && (
        <Box p={3} mb={3} borderRadius="md" bg="red.subtle" borderWidth="1px" borderColor="red.200">
          <Text textStyle="xs" color="red.600" fontWeight="medium">Rejection reason</Text>
          <Text textStyle="xs" color="red.500" mt={0.5}>{record.rejection_reason}</Text>
        </Box>
      )}
      {record?.status === 'PENDING' && (
        <Text textStyle="xs" color="fg.subtle" mb={3}>
          Submitted {new Date(record.submitted_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })} — awaiting review
        </Text>
      )}
      {record?.status === 'APPROVED' && (
        <Flex align="center" gap={1.5} mb={3}>
          <LuCheck size={12} color="var(--chakra-colors-success-600)" />
          <Text textStyle="xs" color="success.fg">
            Approved {record.reviewed_at ? new Date(record.reviewed_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : ''}
          </Text>
        </Flex>
      )}
      {children}
    </Box>
  );
}

function VerificationsTab() {
  const router = useRouter();
  const { data: profile } = useVendorProfile();
  const { data: completeness } = useProfileCompleteness();
  const { data: verifications } = useGetVerifications();
  const [selectedBusinessType, setSelectedBusinessType] = useState('cac');

  const businessInfoComplete = completeness?.sections.business_info.completed ?? false;
  const points = profile?.verification_points ?? 0;
  const tier = profile?.current_tier ?? 'TIER_0';

  const nextThreshold = TIER_THRESHOLDS.find((t) => points < t.max && points >= t.min);
  const nextPoints = nextThreshold ? nextThreshold.max - points : 0;

  const verifMap: Record<string, VerificationRecord> = Object.fromEntries(
    (verifications ?? []).map((v) => [v.type, v])
  );

  const ninRecord = verifMap['NIN'];
  const addressRecord = verifMap['ADDRESS'];
  const businessRecord = verifMap['CAC'] ?? verifMap['SMEDAN'];

  const getCTA = (type: VerificationType, record: VerificationRecord | undefined) => {
    if (!businessInfoComplete || !record || record.status !== 'REJECTED') return null;
    return (
      <Button colorPalette="red" variant="outline" size="sm" w="full"
        onClick={() => router.push(`/verifications/${type.toLowerCase()}/resubmit?id=${record.id}`)}>
        Resubmit <LuArrowRight size={14} />
      </Button>
    );
  };

  return (
    <Stack gap={6}>
      {/* Sub-header */}
      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={3}>
        <Stack gap={1}>
          <Flex align="center" gap={3}>
            <Text fontWeight="semibold" color="fg" textStyle="lg">Verification Status</Text>
            <TierBadge tier={tier} size="md" />
          </Flex>
          <Text color="fg.muted" textStyle="sm">
            Complete verifications to increase your tier and build buyer trust.
          </Text>
        </Stack>
        <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" textAlign="right">
          <Text textStyle="2xl" fontWeight="bold" color="fg">{points}</Text>
          <Text textStyle="xs" color="fg.muted">verification points</Text>
          {tier !== 'TIER_4' && (
            <Text textStyle="xs" color="primary.fg" mt={0.5}>{nextPoints} more to next tier</Text>
          )}
        </Box>
      </Flex>

      {!businessInfoComplete && (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Business profile required</Alert.Title>
            <Alert.Description>
              Complete your business profile to unlock verification submissions.{' '}
              <Button variant="plain" size="xs" color="warning.fg" fontWeight="semibold" p={0} h="auto"
                onClick={() => router.push('/onboarding/business-info')}>
                Complete now →
              </Button>
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <VerificationCard icon={LuIdCard} title="NIN Verification" points="+10 points" record={ninRecord} locked={!businessInfoComplete}>
        {!ninRecord && businessInfoComplete && (
          <Button colorPalette="primary" variant="outline" size="sm" w="full" onClick={() => router.push('/verifications/nin')}>
            Start Verification <LuArrowRight size={14} />
          </Button>
        )}
        {getCTA('NIN', ninRecord)}
      </VerificationCard>

      <VerificationCard icon={LuMapPin} title="Address Verification" points="+5 points" record={addressRecord} locked={!businessInfoComplete}>
        {!addressRecord && businessInfoComplete && (
          <Button colorPalette="primary" variant="outline" size="sm" w="full" onClick={() => router.push('/verifications/address')}>
            Start Verification <LuArrowRight size={14} />
          </Button>
        )}
        {getCTA('ADDRESS', addressRecord)}
      </VerificationCard>

      <VerificationCard icon={LuBuilding2} title="Business Verification" points="+15 pts (CAC) or +8 pts (SMEDAN)" record={businessRecord} locked={!businessInfoComplete}>
        {!businessRecord && businessInfoComplete && (
          <Stack gap={3}>
            <SingleChipSelect options={BUSINESS_TYPE_OPTIONS} value={selectedBusinessType} onChange={setSelectedBusinessType} direction="column" />
            <Button colorPalette="primary" variant="outline" size="sm" w="full" onClick={() => router.push(`/verifications/${selectedBusinessType}`)}>
              Start Verification <LuArrowRight size={14} />
            </Button>
          </Stack>
        )}
        {businessRecord?.status === 'REJECTED' && (
          <Button colorPalette="red" variant="outline" size="sm" w="full"
            onClick={() => router.push(`/verifications/${businessRecord.type.toLowerCase()}/resubmit?id=${businessRecord.id}`)}>
            <LuStore size={14} /> Resubmit <LuArrowRight size={14} />
          </Button>
        )}
      </VerificationCard>
    </Stack>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function VendorProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'personal-info';
  const { data: profile, isLoading } = useVendorProfile();

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : (profile?.first_name?.[0] ?? 'V').toUpperCase();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Vendor';

  if (isLoading) return <AppShell><FullPageSpinner /></AppShell>;

  return (
    <AppShell>
      <Stack gap={6} >
        {/* Profile header */}
        <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" position="relative">
          <Box position="absolute" top={4} right={4}>
            <TierBadge tier={profile?.current_tier ?? 'TIER_0'} size="md" />
          </Box>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align="center"
            gap={{ base: 3, sm: 4 }}
          >
            <Flex
              w={14} h={14} borderRadius="full" bg="primary.subtle"
              align="center" justify="center" flexShrink={0}
            >
              <Text fontWeight="bold" textStyle="xl" color="primary.fg">{initials}</Text>
            </Flex>
            <Box flex={1} minW={0} textAlign={{ base: 'center', sm: 'left' }}>
              <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">{fullName}</Heading>
              <Text textStyle="sm" color="fg.muted" mt={0.5}>{profile?.user?.email}</Text>
              <Flex align="center" gap={1.5} mt={2} justify={{ base: 'center', sm: 'flex-start' }}>
                <Text textStyle="sm" fontWeight="bold" color="fg">
                  {profile?.profile_completeness ?? 0}%
                </Text>
                <Text textStyle="xs" color="fg.muted">profile complete</Text>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Tabs */}
        <Tabs.Root
          value={activeTab}
          onValueChange={({ value }) => router.push(`/vendor/profile?tab=${value}`)}
        >
          <Tabs.List gap={{ base: 3, sm: 0 }}>
            <Tabs.Trigger value="personal-info">
              <LuUser size={20} />
              <Box hideBelow="sm">Personal Info</Box>
            </Tabs.Trigger>
            <Tabs.Trigger value="business-info">
              <LuBuilding2 size={20} />
              <Box hideBelow="sm">Business Info</Box>
            </Tabs.Trigger>
            <Tabs.Trigger value="verifications">
              <LuShieldCheck size={20} />
              <Box hideBelow="sm">Verifications</Box>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt={6}>
            <Tabs.Content value="personal-info">
              <PersonalInfoTab />
            </Tabs.Content>
            <Tabs.Content value="business-info">
              <BusinessInfoTab />
            </Tabs.Content>
            <Tabs.Content value="verifications">
              <VerificationsTab />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
    </AppShell>
  );
}
