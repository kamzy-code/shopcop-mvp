'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuArrowRight, LuMapPin, LuShieldCheck } from 'react-icons/lu';
import { useSubmitAddressVerification } from '@/app/_hooks/vendor';
import { useUploadSensitiveDocument } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import { toaster } from '@/components/ui/toaster';

type SubmitState = 'idle' | 'submitting' | 'success' | 'failed';

export default function AddressVerificationPage() {
  const router = useRouter();
  const verifyMutation = useSubmitAddressVerification();
  const uploadMutation = useUploadSensitiveDocument();

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
                Address Document Submitted
              </Text>
              <Text color="fg.muted" textStyle="sm">
                Your proof of address has been submitted and is under review. We will notify you once it is approved.
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
          <LuMapPin size={20} color="var(--chakra-colors-primary-600)" />
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          Address Verification
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Upload a proof of address document to confirm your business location.
        </Text>
      </Stack>

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
          onClick={() => router.push('/dashboard')}
        >
          <LuArrowLeft size={14} />
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  );
}
