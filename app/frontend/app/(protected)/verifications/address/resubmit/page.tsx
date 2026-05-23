'use client';
import { useState } from 'react';
import { Alert, Box, Button, Field, Flex, Stack, Text } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuArrowRight, LuMapPin } from 'react-icons/lu';
import { FileUpload } from '@/components/shared/fileUpload';
import { FormCard } from '@/components/shared/formCard';
import { MutationErrorAlert } from '@/components/shared/mutationErrorAlert';
import { VerificationSuccessCard } from '@/components/shared/verificationSuccessCard';
import { useGetVerification, useResubmitVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';

export default function AddressResubmitPage() {
  const router = useRouter();
  const id = useSearchParams().get('id') ?? '';
  const { data: record, isLoading } = useGetVerification(id);
  const resubmitMutation = useResubmitVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!docFile && !record?.address_document_url) {
      setFileError('Please upload a proof of address document');
      return;
    }
    setFileError(null);

    let url = record?.address_document_url ?? '';
    let publicId = record?.address_document_public_id ?? '';

    if (docFile) {
      const uploaded = await uploadMutation.mutateAsync({ file: docFile, setUploadProgress });
      url = uploaded.url;
      publicId = uploaded.publicId;
    }

    await resubmitMutation.mutateAsync({
      id,
      data: {
        address_document_url: url,
        address_document_public_id: publicId,
      },
    });
    setSuccess(true);
  };

  if (isLoading) return null;

  return (
    <FormCard
      icon={<LuMapPin size={20} color="var(--chakra-colors-primary-600)" />}
      title="Resubmit Address Verification"
      description="Upload a new proof of address document to resubmit your verification."
    >
      {success ? (
        <VerificationSuccessCard
          title="Address Document Resubmitted"
          description="Your updated address document has been submitted for review."
          actionLabel="Back to Verifications"
          onAction={() => router.push('/verifications')}
        />
      ) : (
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

          <Box p={4} borderRadius="lg" bg="bg.subtle" borderWidth="1px" borderColor="border">
            <Text textStyle="sm" fontWeight="semibold" color="fg" mb={2}>Accepted documents</Text>
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
              onFileSelect={(file) => { setDocFile(file); if (file) setFileError(null); }}
              label="Upload updated proof of address"
              hint="JPG, PNG, or PDF, max 5MB"
            />
            {fileError && <Field.ErrorText>{fileError}</Field.ErrorText>}
          </Field.Root>

          <MutationErrorAlert error={resubmitMutation.error} />

          <Button
            colorPalette="primary"
            size="lg"
            w="full"
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || resubmitMutation.isPending}
            loading={uploadMutation.isPending || resubmitMutation.isPending}
            loadingText={uploadMutation.isPending ? `Uploading... ${uploadProgress}%` : 'Submitting...'}
          >
            Resubmit Verification <LuArrowRight />
          </Button>
        </Stack>
      )}
    </FormCard>
  );
}
