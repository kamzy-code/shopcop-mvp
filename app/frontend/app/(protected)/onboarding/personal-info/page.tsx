'use client';
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
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowRight, LuUser } from 'react-icons/lu';
import { personalInfoSchema, PersonalInfoFormData } from '@/app/validators/vendorSchema';
import { useOnboardingStore } from '@/app/_store/onboardingStore';
import { useSubmitPersonalInfo } from '@/app/_hooks/vendor';
import { toaster } from '@/components/ui/toaster';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export default function PersonalInfoPage() {
  const router = useRouter();
  const setPersonalInfo = useOnboardingStore((s) => s.setPersonalInfo);
  const savedInfo = useOnboardingStore((s) => s.personalInfo);
  const submitMutation = useSubmitPersonalInfo();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      first_name: savedInfo?.first_name || '',
      middle_name: savedInfo?.middle_name || '',
      last_name: savedInfo?.last_name || '',
      gender: savedInfo?.gender,
      date_of_birth: savedInfo?.date_of_birth || '',
      phone_number: savedInfo?.phone_number || '',
    },
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: PersonalInfoFormData) => {
    const payload = {
      ...data,
      middle_name: data.middle_name || undefined,
    };

    try {
      await submitMutation.mutateAsync(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save personal info';
      toaster.create({ title: 'Error', description: message, type: 'error' });
      return;
    }

    setPersonalInfo(payload);
    router.push('/onboarding/business-info');
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
          <LuUser size={20} color="var(--chakra-colors-primary-600)" />
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          Personal Information
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Tell us a bit about yourself so we can verify your identity.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          {/* Name row */}
          <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
            <Field.Root invalid={!!errors.first_name} required flex={1}>
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

            <Field.Root invalid={!!errors.last_name} required flex={1}>
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
          <Field.Root invalid={!!errors.gender} required>
            <Field.Label color="fg">Gender</Field.Label>
            <Flex gap={2} pt={1}>
              {GENDER_OPTIONS.map(({ value, label }) => {
                const isSelected = selectedGender === value;
                return (
                  <Flex
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue('gender', value, { shouldValidate: true })}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setValue('gender', value, { shouldValidate: true })
                    }
                    align="center"
                    justify="center"
                    px={4}
                    py={2}
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor={isSelected ? 'primary.500' : 'border'}
                    bg={isSelected ? 'primary.subtle' : 'transparent'}
                    color={isSelected ? 'primary.fg' : 'fg.muted'}
                    cursor="pointer"
                    transition="all 0.15s"
                    fontWeight={isSelected ? 'medium' : 'normal'}
                    userSelect="none"
                    flex={1}
                    _hover={{ borderColor: 'primary.400', color: 'fg' }}
                  >
                    <Text textStyle="sm">{label}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Field.ErrorText>{errors.gender?.message}</Field.ErrorText>
          </Field.Root>

          {/* Date of birth */}
          <Field.Root invalid={!!errors.date_of_birth} required>
            <Field.Label color="fg">Date of Birth</Field.Label>
            <Input
              {...register('date_of_birth')}
              type="date"
              size="lg"
              colorPalette="primary"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                .toISOString()
                .split('T')[0]}
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              You must be at least 16 years old.
            </Field.HelperText>
            <Field.ErrorText>{errors.date_of_birth?.message}</Field.ErrorText>
          </Field.Root>

          {/* Phone number */}
          <Field.Root invalid={!!errors.phone_number} required>
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

          <Button
            type="submit"
            colorPalette="primary"
            size="lg"
            w="full"
            loading={isSubmitting || submitMutation.isPending}
            disabled={isSubmitting || submitMutation.isPending}
          >
            Continue to Business Info
            <LuArrowRight />
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
