'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Field, Input, Stack } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight } from 'react-icons/lu';
import { ninSchema, NinFormData } from '@/app/validators/vendorSchema';
import { FileUpload } from '@/components/shared/fileUpload';
import { FormCard } from '@/components/shared/formCard';
import { AlertModal } from '@/components/ui/alert-modal';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { useGetVerification, useResubmitVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { LuIdCard } from 'react-icons/lu';

export default function NinResubmitPage() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const { data: record, isLoading } = useGetVerification(id);
  const resubmitMutation = useResubmitVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NinFormData>({
    resolver: zodResolver(ninSchema),
    values: {
      nin_full_name: record?.nin_full_name ?? '',
      nin_number: record?.nin_number ?? '',
    },
  });

  const onSubmit = async (data: NinFormData) => {
    if (!govIdFile && !record?.govt_id_front_url) {
      setFileError('Please upload your government ID photo');
      return;
    }
    setFileError(null);

    let url = record?.govt_id_front_url ?? '';
    let publicId = record?.govt_id_front_public_id ?? '';

    try {
      if (govIdFile) {
        const uploaded = await uploadMutation.mutateAsync({ file: govIdFile, setUploadProgress });
        url = uploaded.url;
        publicId = uploaded.publicId;
      }

      await resubmitMutation.mutateAsync({
        id,
        data: {
          nin_number: data.nin_number,
          nin_full_name: data.nin_full_name,
          govt_id_front_url: url,
          govt_id_front_public_id: publicId,
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
        icon={<LuIdCard size={20} color="var(--chakra-colors-primary-600)" />}
      title="Resubmit NIN Verification"
      description="Correct the issues below and resubmit your NIN verification."
    >
      {success ? (
        <VerificationSuccessCard
          title="NIN Resubmitted"
          description="Your updated NIN verification has been submitted for review."
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

            <Field.Root invalid={!!errors.nin_full_name} required>
              <Field.Label color="fg">Full Legal Name</Field.Label>
              <Input {...register('nin_full_name')} placeholder="As it appears on your NIN" size="lg" colorPalette="primary" />
              <Field.ErrorText>{errors.nin_full_name?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.nin_number} required>
              <Field.Label color="fg">National Identification Number (NIN)</Field.Label>
              <Input {...register('nin_number')} placeholder="11-digit NIN" size="lg" colorPalette="primary" maxLength={11} inputMode="numeric" />
              <Field.ErrorText>{errors.nin_number?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!fileError}>
              <Field.Label color="fg">Government ID Photo</Field.Label>
              <FileUpload
                accept="image/jpeg,image/png"
                maxSizeMB={2}
                onFileSelect={(file) => { setGovIdFile(file); if (file) setFileError(null); }}
                label="Upload updated ID photo (or keep existing)"
                hint="JPG or PNG, max 2MB"
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
