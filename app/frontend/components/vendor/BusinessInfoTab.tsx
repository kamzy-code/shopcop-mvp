'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { LuPencil } from 'react-icons/lu';
import {
  businessInfoSchema,
  BusinessInfoFormData,
  NIGERIAN_STATES,
  PAYMENT_MODEL_OPTIONS,
  REFUND_POLICY_OPTIONS,
  REFUND_DURATION_OPTIONS,
  COMMON_REFUND_CONDITIONS,
  CONTACT_OPTIONS,
} from '@/app/validators/vendorSchema';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useVendorProfile, useSubmitBusinessInfo, useGetCategories } from '@/app/_hooks/vendor';
import { SingleChipSelect, MultiChipSelect } from '@/components/shared/chipSelect';
import { SectionHeader, SectionLabel } from '@/components/shared/formCard';
import { FieldRow, ChipList } from '@/components/vendor/profileHelpers';

export function BusinessInfoTab() {
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

  const instagramValue = watch('instagram_handle') || '';
  const tiktokValue = watch('tiktok_handle') || '';
  const facebookValue = watch('facebook_url') || '';
  const whatsappValue = watch('whatsapp_number') || '';
  const currentPrimaryContact = watch('primary_contact');

  const selectedCategoryData = categories.find((c) => c.name === selectedPrimaryCategory);
  const subcategoryOptions = selectedCategoryData?.subcategories.map((s) => ({ value: s, label: s })) ?? [];

  const availableContactOptions = CONTACT_OPTIONS.filter((o) => {
    if (o.value === 'INSTAGRAM')  return !!instagramValue.trim();
    if (o.value === 'TIKTOK')     return !!tiktokValue.trim();
    if (o.value === 'FACEBOOK')   return !!facebookValue.trim();
    if (o.value === 'WHATSAPP')   return !!whatsappValue.trim();
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

        <Box pt={1} pb={1}>
          <SectionLabel>Business Identity</SectionLabel>
        </Box>
        <FieldRow label="Business Name" value={profile?.business_name} />
        <FieldRow label="Description" value={profile?.business_description} />

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

        <Box pt={5} mt={1}>
          <SectionLabel>Location</SectionLabel>
        </Box>
        <FieldRow label="State" value={profile?.state} />
        <FieldRow label="City" value={profile?.city} />
        <FieldRow label="Street Address" value={profile?.street_address} />
        <FieldRow label="Landmark" value={profile?.landmark} />

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
