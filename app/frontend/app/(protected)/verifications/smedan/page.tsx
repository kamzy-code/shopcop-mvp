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
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuShieldCheck, LuStore } from 'react-icons/lu';
import {
  smedanVerificationSchema,
  SmedanVerificationFormData,
  SMEDAN_BUSINESS_TYPES,
} from '@/app/validators/vendorSchema';
import { useSubmitSMEDANVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { toaster } from '@/components/ui/toaster';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function SmedanVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitSMEDANVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SmedanVerificationFormData>({
    resolver: zodResolver(smedanVerificationSchema),
  });

  const selectedType = watch('smedan_business_type');

  const onSubmit = async (data: SmedanVerificationFormData) => {
    if (!certFile) {
      setFileError('Please upload your SMEDAN certificate');
      return;
    }
    setFileError(null);
    setSubmitState('submitting');

    try {
      const uploaded = await uploadMutation.mutateAsync({ file: certFile, setUploadProgress });
      await verifyMutation.mutateAsync({
        smedan_suin: data.smedan_suin,
        smedan_business_type: data.smedan_business_type,
        smedan_certificate_url: uploaded.url,
        smedan_certificate_public_id: uploaded.publicId,
      });
      setSubmitState('success');
    } catch (error) {
      setSubmitState('failed');
      const message = error instanceof Error ? error.message : 'Submission failed';
      toaster.create({ title: 'Submission failed', description: message, type: 'error' });
    }
  };

  if (submitState === 'success') {
    return (
      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        p={{ base: 6, sm: 8 }}
        shadow="lg"
      >
        <Stack gap={6}>
          <Flex direction="column" align="center" gap={4} py={8}>
            <Flex
              w={16}
              h={16}
              borderRadius="full"
              bg="success.subtle"
              align="center"
              justify="center"
            >
              <LuShieldCheck size={32} color="var(--chakra-colors-success-600)" />
            </Flex>
            <Stack gap={1} textAlign="center">
              <Text fontWeight="semibold" color="fg" textStyle="lg">
                SMEDAN Submitted
              </Text>
              <Text color="fg.muted" textStyle="sm">
                Your SMEDAN certificate has been submitted and is under review. We will notify you once it is approved.
              </Text>
            </Stack>
          </Flex>
          <Button colorPalette="primary" size="lg" w="full" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
            <LuArrowRight />
          </Button>
        </Stack>
      </Box>
    );
  }

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
          <LuStore size={20} color="var(--chakra-colors-primary-600)" />
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          SMEDAN Verification
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Submit your SMEDAN registration to verify your small or medium enterprise status.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Field.Root invalid={!!errors.smedan_suin} required>
            <Field.Label color="fg">SUIN (SMEDAN Unique Identification Number)</Field.Label>
            <Input
              {...register('smedan_suin')}
              placeholder="e.g. SMEDAN-12345"
              size="lg"
              colorPalette="primary"
              autoComplete="off"
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Your SUIN as shown on your SMEDAN registration certificate.
            </Field.HelperText>
            <Field.ErrorText>{errors.smedan_suin?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.smedan_business_type} required>
            <Field.Label color="fg">Business Type</Field.Label>
            <Stack gap={2} pt={1}>
              {SMEDAN_BUSINESS_TYPES.map(({ value, label }) => {
                const isSelected = selectedType === value;
                return (
                  <Flex
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue('smedan_business_type', value, { shouldValidate: true })}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      setValue('smedan_business_type', value, { shouldValidate: true })
                    }
                    align="center"
                    px={4}
                    py={3}
                    borderRadius="lg"
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
                    <Text textStyle="sm">{label}</Text>
                  </Flex>
                );
              })}
            </Stack>
            <Field.ErrorText>{errors.smedan_business_type?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!fileError} required>
            <Field.Label color="fg">SMEDAN Certificate</Field.Label>
            <FileUpload
              accept="image/jpeg,image/png,application/pdf"
              maxSizeMB={5}
              onFileSelect={(file) => {
                setCertFile(file);
                if (file) setFileError(null);
              }}
              label="Upload SMEDAN certificate"
              hint="JPG, PNG, or PDF, max 5MB"
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Upload a clear scan or photo of your SMEDAN registration certificate.
            </Field.HelperText>
            {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
          </Field.Root>

          {submitState === 'failed' && (
            <Box p={4} borderRadius="lg" bg="red.subtle" borderWidth="1px" borderColor="red.200">
              <Text textStyle="sm" color="red.600" fontWeight="medium">Submission Failed</Text>
              <Text textStyle="xs" color="red.500" mt={1}>
                {verifyMutation.error instanceof Error
                  ? verifyMutation.error.message
                  : 'An error occurred. Please try again.'}
              </Text>
            </Box>
          )}

          <Button
            type="submit"
            colorPalette="primary"
            size="lg"
            w="full"
            disabled={submitState === 'submitting' || uploadMutation.isPending}
            loading={submitState === 'submitting' || uploadMutation.isPending}
            loadingText={uploadMutation.isPending ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
          >
            Submit SMEDAN Verification
            <LuArrowRight />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => router.push('/dashboard')}
          >
            <LuArrowLeft size={14} />
            Back to Dashboard
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
