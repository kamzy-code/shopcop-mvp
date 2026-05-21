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
import { LuArrowLeft, LuArrowRight, LuBuilding2, LuShieldCheck } from 'react-icons/lu';
import {
  cacVerificationSchema,
  CacVerificationFormData,
  CAC_COMPANY_TYPES,
} from '@/app/validators/vendorSchema';
import { useSubmitCACVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { toaster } from '@/components/ui/toaster';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function CacVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitCACVerification();
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
  } = useForm<CacVerificationFormData>({
    resolver: zodResolver(cacVerificationSchema),
  });

  const selectedType = watch('cac_company_type');

  const onSubmit = async (data: CacVerificationFormData) => {
    if (!certFile) {
      setFileError('Please upload your CAC certificate');
      return;
    }
    setFileError(null);
    setSubmitState('submitting');

    try {
      const uploaded = await uploadMutation.mutateAsync({ file: certFile, setUploadProgress });
      await verifyMutation.mutateAsync({
        cac_rc_number: data.cac_rc_number,
        cac_company_type: data.cac_company_type,
        cac_certificate_url: uploaded.url,
        cac_certificate_public_id: uploaded.publicId,
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
                CAC Submitted
              </Text>
              <Text color="fg.muted" textStyle="sm">
                Your CAC certificate has been submitted and is under review. We will notify you once it is approved.
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
          <LuBuilding2 size={20} color="var(--chakra-colors-primary-600)" />
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          CAC Verification
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Submit your Corporate Affairs Commission registration to unlock higher verification tiers.
        </Text>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={6}>
          <Field.Root invalid={!!errors.cac_rc_number} required>
            <Field.Label color="fg">RC Number</Field.Label>
            <Input
              {...register('cac_rc_number')}
              placeholder="e.g. RC1234567"
              size="lg"
              colorPalette="primary"
              autoComplete="off"
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Your Registration Number as shown on the CAC certificate.
            </Field.HelperText>
            <Field.ErrorText>{errors.cac_rc_number?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!errors.cac_company_type} required>
            <Field.Label color="fg">Company Type</Field.Label>
            <Stack gap={2} pt={1}>
              {CAC_COMPANY_TYPES.map(({ value, label }) => {
                const isSelected = selectedType === value;
                return (
                  <Flex
                    key={value}
                    role="button"
                    tabIndex={0}
                    onClick={() => setValue('cac_company_type', value, { shouldValidate: true })}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      setValue('cac_company_type', value, { shouldValidate: true })
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
            <Field.ErrorText>{errors.cac_company_type?.message}</Field.ErrorText>
          </Field.Root>

          <Field.Root invalid={!!fileError} required>
            <Field.Label color="fg">CAC Certificate</Field.Label>
            <FileUpload
              accept="image/jpeg,image/png,application/pdf"
              maxSizeMB={5}
              onFileSelect={(file) => {
                setCertFile(file);
                if (file) setFileError(null);
              }}
              label="Upload CAC certificate"
              hint="JPG, PNG, or PDF, max 5MB"
            />
            <Field.HelperText color="fg.subtle" textStyle="xs">
              Upload a clear scan or photo of your CAC registration certificate.
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
            Submit CAC Verification
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
