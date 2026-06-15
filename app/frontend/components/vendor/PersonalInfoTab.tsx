'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Field, Flex, Heading, Input, Spinner, Stack, Text } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { LuPencil } from 'react-icons/lu';
import {
  personalInfoSchema,
  PersonalInfoFormData,
} from '@/app/validators/vendorSchema';
import { toaster } from '@/components/ui/toaster';
import { AlertModal } from '@/components/ui/alert-modal';
import { useVendorProfile, useSubmitPersonalInfo } from '@/app/_hooks/vendor';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { FieldRow } from '@/components/vendor/profileHelpers';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export function PersonalInfoTab() {
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
