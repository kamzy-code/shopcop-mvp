'use client';
import { useEffect } from 'react';
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
} from '@chakra-ui/react';
import { LuUser } from 'react-icons/lu';
import { adminProfileSchema, AdminProfileFormData } from '@/app/validators/adminSchema';
import { useAdminProfile, useUpdateAdminProfile } from '@/app/_hooks/admin';
import { toaster } from '@/components/ui/toaster';
import { MutationErrorAlert } from '@/components/shared/mutationErrorAlert';
import { SingleChipSelect } from '@/components/shared/chipSelect';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export default function AdminProfilePage() {
  const { data: profile, isLoading } = useAdminProfile();
  const updateMutation = useUpdateAdminProfile();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminProfileFormData>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: undefined,
      date_of_birth: '',
      phone_number: '',
      department: '',
      role_title: '',
    },
  });

  const selectedGender = watch('gender');

  // Pre-populate form once profile data loads
  useEffect(() => {
    if (!profile) return;
    reset({
      first_name: profile.first_name ?? '',
      middle_name: profile.middle_name ?? '',
      last_name: profile.last_name ?? '',
      gender: profile.gender ?? undefined,
      date_of_birth: profile.date_of_birth
        ? profile.date_of_birth.split('T')[0]
        : '',
      phone_number: profile.phone_number ?? '',
      department: profile.department ?? '',
      role_title: profile.role_title ?? '',
    });
  }, [profile, reset]);

  const onSubmit = async (data: AdminProfileFormData) => {
    // Strip empty strings to undefined so unchanged optional fields aren't sent
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
    ) as Partial<AdminProfileFormData>;

    try {
      await updateMutation.mutateAsync(payload as any);
      toaster.create({
        title: 'Profile updated',
        description: 'Your admin profile has been saved.',
        type: 'success',
      });
    } catch (error) {
      // MutationErrorAlert below handles display
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" colorPalette="primary" />
      </Flex>
    );
  }

  return (
    <Stack gap={8} maxW="2xl">
      {/* Header */}
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          My Profile
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Update your personal information and admin details.
        </Text>
      </Stack>

      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        overflow="hidden"
      >
        {/* Card header */}
        <Flex
          px={6}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          align="center"
          gap={3}
        >
          <Flex
            w={9}
            h={9}
            borderRadius="lg"
            bg="primary.subtle"
            align="center"
            justify="center"
            color="primary.fg"
            flexShrink={0}
          >
            <LuUser size={18} />
          </Flex>
          <Stack gap={0}>
            <Text textStyle="sm" fontWeight="semibold" color="fg">
              Personal Information
            </Text>
            <Text textStyle="xs" color="fg.muted">
              Name, contact details, and role
            </Text>
          </Stack>
        </Flex>

        <Box px={6} py={6}>
          <MutationErrorAlert error={updateMutation.error} />

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={6}>
              {/* Name row */}
              <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
                <Field.Root invalid={!!errors.first_name} flex={1}>
                  <Field.Label color="fg">First Name</Field.Label>
                  <Input
                    {...register('first_name')}
                    placeholder="e.g. Chukwuemeka"
                    size="lg"
                    colorPalette="primary"
                    autoComplete="given-name"
                  />
                  <Field.ErrorText>{errors.first_name?.message}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.last_name} flex={1}>
                  <Field.Label color="fg">Last Name</Field.Label>
                  <Input
                    {...register('last_name')}
                    placeholder="e.g. Okonkwo"
                    size="lg"
                    colorPalette="primary"
                    autoComplete="family-name"
                  />
                  <Field.ErrorText>{errors.last_name?.message}</Field.ErrorText>
                </Field.Root>
              </Flex>

              {/* Middle name */}
              <Field.Root invalid={!!errors.middle_name}>
                <Field.Label color="fg">
                  Middle Name{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
                <Input
                  {...register('middle_name')}
                  placeholder="e.g. Ikenna"
                  size="lg"
                  colorPalette="primary"
                  autoComplete="additional-name"
                />
                <Field.ErrorText>{errors.middle_name?.message}</Field.ErrorText>
              </Field.Root>

              {/* Gender */}
              <Field.Root invalid={!!errors.gender}>
                <Field.Label color="fg">
                  Gender{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
                <SingleChipSelect
                  options={[...GENDER_OPTIONS]}
                  value={selectedGender}
                  onChange={(v) =>
                    setValue('gender', v as AdminProfileFormData['gender'], {
                      shouldValidate: true,
                    })
                  }
                  showCheck={false}
                  stretch={true}
                />
                <Field.ErrorText>{errors.gender?.message}</Field.ErrorText>
              </Field.Root>

              {/* Date of birth */}
              <Field.Root invalid={!!errors.date_of_birth}>
                <Field.Label color="fg">
                  Date of Birth{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
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

              {/* Phone number */}
              <Field.Root invalid={!!errors.phone_number}>
                <Field.Label color="fg">Phone Number</Field.Label>
                <Input
                  {...register('phone_number')}
                  placeholder="e.g. 08012345678"
                  size="lg"
                  colorPalette="primary"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                />
                <Field.HelperText color="fg.subtle" textStyle="xs">
                  Enter a valid Nigerian number starting with 07, 08, or 09 (or +234).
                </Field.HelperText>
                <Field.ErrorText>{errors.phone_number?.message}</Field.ErrorText>
              </Field.Root>

              {/* Department */}
              <Field.Root invalid={!!errors.department}>
                <Field.Label color="fg">
                  Department{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
                <Input
                  {...register('department')}
                  placeholder="e.g. Verification Team"
                  size="lg"
                  colorPalette="primary"
                />
                <Field.ErrorText>{errors.department?.message}</Field.ErrorText>
              </Field.Root>

              {/* Role title */}
              <Field.Root invalid={!!errors.role_title}>
                <Field.Label color="fg">
                  Role Title{' '}
                  <Text as="span" color="fg.muted" fontWeight="normal">
                    (optional)
                  </Text>
                </Field.Label>
                <Input
                  {...register('role_title')}
                  placeholder="e.g. Senior Admin"
                  size="lg"
                  colorPalette="primary"
                />
                <Field.ErrorText>{errors.role_title?.message}</Field.ErrorText>
              </Field.Root>

              <Button
                type="submit"
                colorPalette="primary"
                size="lg"
                w="full"
                loading={isSubmitting || updateMutation.isPending}
                disabled={isSubmitting || updateMutation.isPending || !isDirty}
              >
                Save Profile
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Stack>
  );
}
