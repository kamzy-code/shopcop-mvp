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
import { LuArrowRight, LuBuilding2, LuCheck } from 'react-icons/lu';
import {
  businessInfoSchema,
  BusinessInfoFormData,
  PRODUCT_CATEGORIES,
} from '@/app/validators/vendorSchema';
import { useOnboardingStore } from '@/app/_store/onboardingStore';
import { toaster } from '@/components/ui/toaster';
import { useSubmitBusinessInfo } from '@/app/_hooks/vendor';

export default function BusinessInfoPage() {
  const router = useRouter();
  const setBusinessInfo = useOnboardingStore((s) => s.setBusinessInfo);
  const savedInfo = useOnboardingStore((s) => s.businessInfo);
  const submitMutation = useSubmitBusinessInfo();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    savedInfo?.categories || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: savedInfo?.businessName || '',
      categories: savedInfo?.categories || [],
      address: savedInfo?.address || '',
      description: savedInfo?.description || '',
    },
  });

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : selectedCategories.length < 3
        ? [...selectedCategories, category]
        : selectedCategories;
    setSelectedCategories(next);
    setValue('categories', next, { shouldValidate: true });
  };

  const onSubmit = async (data: BusinessInfoFormData) => {
    if (selectedCategories.length === 0) {
      setError('categories', { message: 'Select at least one category' });
      return;
    }

    const payload = { ...data, categories: selectedCategories };

    try {
      await submitMutation.mutateAsync(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save business info';
      toaster.create({ title: 'Error', description: message, type: 'error' });
      return;
    }

    setBusinessInfo({
      businessName: payload.businessName,
      categories: payload.categories,
      address: payload.address,
      description: payload.description || '',
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
          {/* Business name */}
          <Field.Root invalid={!!errors.businessName} required>
            <Field.Label color="fg">Business Name</Field.Label>
            <Input
              {...register('businessName')}
              placeholder="e.g. Chimere Electronics"
              size="lg"
              colorPalette="primary"
            />
            <Field.ErrorText>{errors.businessName?.message}</Field.ErrorText>
          </Field.Root>

          {/* Categories */}
          <Field.Root invalid={!!errors.categories} required>
            <Field.Label color="fg">
              Product Category{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (select up to 3)
              </Text>
            </Field.Label>
            <Flex gap={2} flexWrap="wrap" pt={1}>
              {PRODUCT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const isDisabled = !isSelected && selectedCategories.length >= 3;
                return (
                  <Flex
                    key={cat}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isDisabled && toggleCategory(cat)}
                    onKeyDown={(e) => e.key === 'Enter' && !isDisabled && toggleCategory(cat)}
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
                    _hover={
                      isDisabled
                        ? {}
                        : isSelected
                          ? { bg: 'primary.subtle' }
                          : { borderColor: 'primary.400', color: 'fg' }
                    }
                  >
                    {isSelected && <LuCheck size={12} />}
                    <Text textStyle="xs">{cat}</Text>
                  </Flex>
                );
              })}
            </Flex>
            <Field.ErrorText>{errors.categories?.message}</Field.ErrorText>
            {selectedCategories.length > 0 && (
              <Text textStyle="xs" color="fg.muted">
                {selectedCategories.length} of 3 selected
              </Text>
            )}
          </Field.Root>

          {/* Address */}
          <Field.Root invalid={!!errors.address} required>
            <Field.Label color="fg">Business Address</Field.Label>
            <Input
              {...register('address')}
              placeholder="e.g. 12 Adeola Odeku Street, Victoria Island, Lagos"
              size="lg"
              colorPalette="primary"
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Enter your full business address including city and state.
            </Field.HelperText>
            <Field.ErrorText>{errors.address?.message}</Field.ErrorText>
          </Field.Root>

          {/* Description */}
          <Field.Root invalid={!!errors.description}>
            <Field.Label color="fg">
              Business Description{' '}
              <Text as="span" color="fg.muted" fontWeight="normal">
                (optional)
              </Text>
            </Field.Label>
            <Textarea
              {...register('description')}
              placeholder="Tell buyers what you sell and what makes your business special..."
              size="lg"
              colorPalette="primary"
              rows={3}
              resize="none"
            />
            <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
          </Field.Root>

          <Button
            type="submit"
            colorPalette="primary"
            size="lg"
            w="full"
            loading={isSubmitting || submitMutation.isPending}
            disabled={isSubmitting}
          >
            Continue to NIN Verification
            <LuArrowRight />
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
