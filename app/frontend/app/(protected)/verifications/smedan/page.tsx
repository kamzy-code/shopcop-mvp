'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Field,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuStore } from 'react-icons/lu';
import { FormCard } from '@/components/shared/formCard';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import {
  smedanVerificationSchema,
  SmedanVerificationFormData,
  SMEDAN_BUSINESS_TYPES,
} from '@/app/validators/vendorSchema';
import { useSubmitSMEDANVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { AlertModal } from '@/components/ui/alert-modal';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function SmedanVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitSMEDANVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });

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
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setErrorModal({ open: true, description: message });
    }
  };

  if (submitState === 'success') {
    return (
      <VerificationSuccessCard
        standalone
        title="SMEDAN Submitted"
        description="Your SMEDAN certificate has been submitted and is under review. We will notify you once it is approved."
        actionLabel="Back to Dashboard"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title="Submission Failed"
        description={errorModal.description}
        type="error"
      />
      <FormCard
        icon={<LuStore size={20} color="var(--chakra-colors-primary-600)" />}
        title="SMEDAN Verification"
      description="Submit your SMEDAN registration to verify your small or medium enterprise status."
    >
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
            <SingleChipSelect
              options={[...SMEDAN_BUSINESS_TYPES]}
              value={selectedType}
              onChange={(v) =>
                setValue(
                  'smedan_business_type',
                  v as SmedanVerificationFormData['smedan_business_type'],
                  { shouldValidate: true }
                )
              }
              direction="column"
            />
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
            onClick={() => router.back()}
          >
            <LuArrowLeft size={14} />
            Back
          </Button>
        </Stack>
      </form>
    </FormCard>
    </>
  );
}
