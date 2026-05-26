'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Field,
  Flex,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuMapPin } from 'react-icons/lu';
import { useSubmitAddressVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { FormCard } from '@/components/shared/formCard';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { AlertModal } from '@/components/ui/alert-modal';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function AddressVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitAddressVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorModal, setErrorModal] = useState<{ open: boolean; description: string }>({ open: false, description: '' });

  const handleSubmit = async () => {
    if (!docFile) {
      setFileError('Please upload a proof of address document');
      return;
    }
    setFileError(null);
    setSubmitState('submitting');

    try {
      const uploaded = await uploadMutation.mutateAsync({ file: docFile, setUploadProgress });
      await verifyMutation.mutateAsync({
        address_document_url: uploaded.url,
        address_document_public_id: uploaded.publicId,
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
        title="Address Document Submitted"
        description="Your proof of address has been submitted and is under review. We will notify you once it is approved."
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
        icon={<LuMapPin size={20} color="var(--chakra-colors-primary-600)" />}
      title="Address Verification"
      description="Upload a proof of address document to confirm your business location."
    >
      <Stack gap={6}>
        <Box p={4} borderRadius="lg" bg="bg.subtle" borderWidth="1px" borderColor="border">
          <Text textStyle="sm" fontWeight="semibold" color="fg" mb={2}>
            Accepted documents
          </Text>
          <Stack gap={1}>
            {[
              'Utility bill (electricity, water, or gas) — dated within 3 months',
              'Bank statement — dated within 3 months',
              'Tenancy agreement',
              'Government-issued address confirmation letter',
            ].map((doc) => (
              <Flex key={doc} align="flex-start" gap={2}>
                <Text color="primary.fg" mt={0.5} flexShrink={0}>•</Text>
                <Text textStyle="xs" color="fg.muted">{doc}</Text>
              </Flex>
            ))}
          </Stack>
        </Box>

        <Field.Root invalid={!!fileError} required>
          <Field.Label color="fg">Proof of Address Document</Field.Label>
          <FileUpload
            accept="image/jpeg,image/png,application/pdf"
            maxSizeMB={5}
            onFileSelect={(file) => {
              setDocFile(file);
              if (file) setFileError(null);
            }}
            label="Upload proof of address"
            hint="JPG, PNG, or PDF, max 5MB"
          />
          <Field.HelperText color="fg.subtle" textStyle="xs">
            Ensure the document clearly shows your name and address.
          </Field.HelperText>
          {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
        </Field.Root>

        <Button
          colorPalette="primary"
          size="lg"
          w="full"
          onClick={handleSubmit}
          disabled={submitState === 'submitting' || uploadMutation.isPending || !docFile}
          loading={submitState === 'submitting' || uploadMutation.isPending}
          loadingText={uploadMutation.isPending ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
        >
          Submit Address Verification
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
    </FormCard>
    </>
  );
}
