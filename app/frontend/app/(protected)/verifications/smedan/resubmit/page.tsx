'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Stack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight, LuStore } from 'react-icons/lu';
import { smedanVerificationSchema, SmedanVerificationFormData, SMEDAN_BUSINESS_TYPES } from '@/app/validators/vendorSchema';
import { FileUpload } from '@/components/shared/fileUpload';
import { FormCard } from '@/components/shared/formCard';
import { MutationErrorAlert } from '@/components/shared/mutationErrorAlert';
import { toaster } from '@/components/ui/toaster';
import { SingleChipSelect } from '@/components/shared/chipSelect';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { useGetVerification, useResubmitVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';

export default function SmedanResubmitPage() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const { data: record, isLoading } = useGetVerification(id);
  const resubmitMutation = useResubmitVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [certFile, setCertFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SmedanVerificationFormData>({
    resolver: zodResolver(smedanVerificationSchema),
    values: {
      smedan_suin: record?.smedan_suin ?? '',
      smedan_business_type: (record?.smedan_business_type as SmedanVerificationFormData['smedan_business_type']) ?? 'SOLE_PROPRIETOR',
    },
  });

  const selectedType = watch('smedan_business_type');

  const onSubmit = async (data: SmedanVerificationFormData) => {
    if (!certFile && !record?.smedan_certificate_url) {
      setFileError('Please upload your SMEDAN certificate');
      return;
    }
    setFileError(null);

    let url = record?.smedan_certificate_url ?? '';
    let publicId = record?.smedan_certificate_public_id ?? '';

    try {
      if (certFile) {
        const uploaded = await uploadMutation.mutateAsync({ file: certFile, setUploadProgress });
        url = uploaded.url;
        publicId = uploaded.publicId;
      }

      await resubmitMutation.mutateAsync({
        id,
        data: {
          smedan_suin: data.smedan_suin,
          smedan_business_type: data.smedan_business_type,
          smedan_certificate_url: url,
          smedan_certificate_public_id: publicId,
        },
      });
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed. Please try again.';
      toaster.create({ title: 'Error', description: message, type: 'error' });
    }
  };

  if (isLoading) return null;

  return (
    <FormCard
      icon={<LuStore size={20} color="var(--chakra-colors-primary-600)" />}
      title="Resubmit SMEDAN Verification"
      description="Correct the issues below and resubmit your SMEDAN verification."
    >
      {success ? (
        <VerificationSuccessCard
          title="SMEDAN Resubmitted"
          description="Your updated SMEDAN verification has been submitted for review."
          actionLabel="Back to Verifications"
          onAction={() => router.push('/verifications')}
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

            <Field.Root invalid={!!errors.smedan_suin} required>
              <Field.Label color="fg">SUIN (SMEDAN Unique Identification Number)</Field.Label>
              <Input {...register('smedan_suin')} placeholder="e.g. SMEDAN-12345" size="lg" colorPalette="primary" autoComplete="off" />
              <Field.HelperText color="fg.subtle" textStyle="xs">Your SUIN as shown on your SMEDAN certificate.</Field.HelperText>
              <Field.ErrorText>{errors.smedan_suin?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.smedan_business_type} required>
              <Field.Label color="fg">Business Type</Field.Label>
              <SingleChipSelect
                options={[...SMEDAN_BUSINESS_TYPES]}
                value={selectedType}
                onChange={(v) => setValue('smedan_business_type', v as SmedanVerificationFormData['smedan_business_type'], { shouldValidate: true })}
                direction="column"
              />
              <Field.ErrorText>{errors.smedan_business_type?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!fileError}>
              <Field.Label color="fg">SMEDAN Certificate</Field.Label>
              <FileUpload
                accept="image/jpeg,image/png,application/pdf"
                maxSizeMB={5}
                onFileSelect={(file) => { setCertFile(file); if (file) setFileError(null); }}
                label="Upload updated certificate (or keep existing)"
                hint="JPG, PNG, or PDF, max 5MB"
              />
              {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
            </Field.Root>

            <MutationErrorAlert error={resubmitMutation.error} />

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
  );
}
