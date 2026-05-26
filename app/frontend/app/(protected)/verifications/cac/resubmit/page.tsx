'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Stack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight, LuBuilding2 } from 'react-icons/lu';
import { cacVerificationSchema, CacVerificationFormData, CAC_COMPANY_TYPES } from '@/app/validators/vendorSchema';
import { FileUpload } from '@/components/shared/fileUpload';
import { FormCard } from '@/components/shared/formCard';
import { AlertModal } from '@/components/ui/alert-modal';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { useGetVerification, useResubmitVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';

export default function CacResubmitPage() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const { data: record, isLoading } = useGetVerification(id);
  const resubmitMutation = useResubmitVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [certFile, setCertFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CacVerificationFormData>({
    resolver: zodResolver(cacVerificationSchema),
    values: {
      cac_rc_number: record?.cac_rc_number ?? '',
      cac_company_type: (record?.cac_company_type as CacVerificationFormData['cac_company_type']) ?? 'BUSINESS_NAME',
    },
  });

  const selectedType = watch('cac_company_type');

  const onSubmit = async (data: CacVerificationFormData) => {
    if (!certFile && !record?.cac_certificate_url) {
      setFileError('Please upload your CAC certificate');
      return;
    }
    setFileError(null);

    let url = record?.cac_certificate_url ?? '';
    let publicId = record?.cac_certificate_public_id ?? '';

    try {
      if (certFile) {
        const uploaded = await uploadMutation.mutateAsync({ file: certFile, setUploadProgress });
        url = uploaded.url;
        publicId = uploaded.publicId;
      }

      await resubmitMutation.mutateAsync({
        id,
        data: {
          cac_rc_number: data.cac_rc_number,
          cac_company_type: data.cac_company_type,
          cac_certificate_url: url,
          cac_certificate_public_id: publicId,
        },
      });
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed. Please try again.';
      setErrorModal({ open: true, description: message });
    }
  };

  if (isLoading) return null;

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
      title="Resubmit CAC Verification"
      description="Correct the issues below and resubmit your CAC verification."
    >
      {success ? (
        <VerificationSuccessCard
          title="CAC Resubmitted"
          description="Your updated CAC verification has been submitted for review."
          actionLabel="Back to Verifications"
          onAction={() => router.back()}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={5}>
            {record?.rejection_reason && (
              <Alert.Root status="error" borderRadius="lg">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Rejection Reason</Alert.Title>
                  <Alert.Description>{record.rejection_reason}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            <Field.Root invalid={!!errors.cac_rc_number} required>
              <Field.Label color="fg">RC Number</Field.Label>
              <Input {...register('cac_rc_number')} placeholder="e.g. RC1234567" size="lg" colorPalette="primary" autoComplete="off" />
              <Field.HelperText color="fg.subtle" textStyle="xs">Your Registration Number as shown on the CAC certificate.</Field.HelperText>
              <Field.ErrorText>{errors.cac_rc_number?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.cac_company_type} required>
              <Field.Label color="fg">Company Type</Field.Label>
              <SingleChipSelect
                options={[...CAC_COMPANY_TYPES]}
                value={selectedType}
                onChange={(v) => setValue('cac_company_type', v as CacVerificationFormData['cac_company_type'], { shouldValidate: true })}
                direction="column"
              />
              <Field.ErrorText>{errors.cac_company_type?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!fileError}>
              <Field.Label color="fg">CAC Certificate</Field.Label>
              <FileUpload
                accept="image/jpeg,image/png,application/pdf"
                maxSizeMB={5}
                onFileSelect={(file) => { setCertFile(file); if (file) setFileError(null); }}
                label="Upload updated certificate (or keep existing)"
                hint="JPG, PNG, or PDF, max 5MB"
              />
              {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
            </Field.Root>

            <Button
              type="submit"
              colorPalette="primary"
              size="lg"
              w="full"
              loading={isSubmitting || uploadMutation.isPending || resubmitMutation.isPending}
              loadingText={uploadMutation.isPending ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
            >
              Resubmit Verification <LuArrowRight />
            </Button>
          </Stack>
        </form>
      )}
    </FormCard>
    </>
  );
}
