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
import { useQueryClient } from '@tanstack/react-query';
import { LuArrowLeft, LuArrowRight, LuIdCard } from 'react-icons/lu';
import { FormCard } from '@/components/shared/formCard';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { ninSchema, NinFormData } from '@/app/validators/vendorSchema';
import { FileUpload } from '@/components/shared/fileUpload';
import { useSubmitNINVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { AlertModal } from '@/components/ui/alert-modal';

type VerifyState = 'idle' | 'verifying' | 'success' | 'failed';

export default function NinPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const verifyMutation = useSubmitNINVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<NinFormData>({
    resolver: zodResolver(ninSchema),
    defaultValues: {
      nin_full_name: '',
      nin_number: '',
    },
  });

  const ninValue = watch('nin_number');

  const onSubmit = async (data: NinFormData) => {
    if (!govIdFile) {
      setFileError('Please upload your government ID photo');
      return;
    }
    setFileError(null);
    setVerifyState('verifying');

    try {
      const uploaded = await uploadMutation.mutateAsync({
        file: govIdFile,
        setUploadProgress,
      });

      await verifyMutation.mutateAsync({
        nin_number: data.nin_number,
        nin_full_name: data.nin_full_name,
        govt_id_front_url: uploaded.url,
        govt_id_front_public_id: uploaded.publicId,
      });

      setVerifyState('success');
      await queryClient.invalidateQueries({ queryKey: ['verifications'] });
    } catch (error) {
      setVerifyState('failed');
      const message = error instanceof Error ? error.message : 'Verification submission failed. Please try again.';
      setErrorModal({ open: true, description: message });
    }
  };

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
        title="NIN Verification"
        description="Your National Identification Number verifies your identity as a registered vendor."
      >
        {verifyState === 'success' ? (
          <VerificationSuccessCard
            title="Identity Verified"
            description="Your NIN has been submitted for review. We will notify you once approved."
            actionLabel="Back to Verifications"
            onAction={() => router.push('/verifications')}
          />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={6}>
              <Field.Root invalid={!!errors.nin_full_name} required>
                <Field.Label color="fg">Full Legal Name</Field.Label>
                <Input
                  {...register('nin_full_name')}
                  placeholder="As it appears on your NIN"
                  size="lg"
                  colorPalette="primary"
                  autoComplete="name"
                />
                <Field.HelperText color="fg.subtle" textStyle="xs">
                  Enter your name exactly as it appears on your National ID.
                </Field.HelperText>
                <Field.ErrorText>{errors.nin_full_name?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.nin_number} required>
                <Field.Label color="fg">National Identification Number (NIN)</Field.Label>
                <Input
                  {...register('nin_number')}
                  placeholder="Enter 11-digit NIN"
                  size="lg"
                  colorPalette="primary"
                  maxLength={11}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                />
                <Field.HelperText color="fg.subtle" textStyle="xs">
                  Your NIN is 11 digits. Dial *346# to retrieve it.
                </Field.HelperText>
                <Field.ErrorText>{errors.nin_number?.message}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!fileError} required>
                <Field.Label color="fg">Government ID Photo</Field.Label>
                <FileUpload
                  accept="image/jpeg,image/png"
                  maxSizeMB={2}
                  onFileSelect={(file) => {
                    setGovIdFile(file);
                    if (file) setFileError(null);
                  }}
                  label="Upload a clear scan or photo of your National ID"
                  hint="JPG or PNG, max 2MB"
                />
                <Field.HelperText color="fg.subtle" textStyle="xs">
                  Take a clear photo of your government-issued ID in good lighting.
                </Field.HelperText>
                {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="primary"
                size="lg"
                w="full"
                disabled={verifyState === 'verifying' || uploadMutation.isPending || !ninValue || ninValue.length < 11}
                loading={verifyState === 'verifying' || uploadMutation.isPending}
                loadingText={uploadMutation.isPending ? `Uploading ID... ${uploadProgress}%` : 'Submitting...'}
              >
                Verify Identity
                <LuArrowRight />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                color="fg.muted"
                onClick={() => router.push('/verifications')}
              >
                <LuArrowLeft size={14} />
                Back to Verifications
              </Button>
            </Stack>
          </form>
        )}
      </FormCard>
    </>
  );
}
