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
import { LuArrowLeft, LuArrowRight, LuBuilding2 } from 'react-icons/lu';
import { FormCard } from '@/components/shared/formCard';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import {
  cacVerificationSchema,
  CacVerificationFormData,
  CAC_COMPANY_TYPES,
} from '@/app/validators/vendorSchema';
import { useSubmitCACVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { AlertModal } from '@/components/ui/alert-modal';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function CacVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitCACVerification();
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
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setErrorModal({ open: true, description: message });
    }
  };

  if (submitState === 'success') {
    return (
      <VerificationSuccessCard
        standalone
        title="CAC Submitted"
        description="Your CAC certificate has been submitted and is under review. We will notify you once it is approved."
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
      icon={<LuBuilding2 size={20} color="var(--chakra-colors-primary-600)" />}
      title="CAC Verification"
      description="Submit your Corporate Affairs Commission registration to unlock higher verification tiers."
    >
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
            <SingleChipSelect
              options={[...CAC_COMPANY_TYPES]}
              value={selectedType}
              onChange={(v) =>
                setValue('cac_company_type', v as CacVerificationFormData['cac_company_type'], {
                  shouldValidate: true,
                })
              }
              direction="column"
            />
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
