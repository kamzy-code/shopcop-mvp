'use client';
import { useState } from 'react';
import { use } from 'react';
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuExternalLink } from 'react-icons/lu';
import {
  useAdminVerificationDetail,
  useAdminSignedUrl,
  useAdminApproveVerification,
  useAdminRejectVerification,
} from '@/app/_hooks/admin';
import { toaster } from '@/components/ui/toaster';
import { MutationErrorAlert } from '@/components/shared/mutationErrorAlert';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'red',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Flex gap={3}>
      <Text textStyle="sm" color="fg.muted" w="40" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color="fg" fontWeight="medium" wordBreak="break-all">
        {value}
      </Text>
    </Flex>
  );
}

export default function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: verification, isLoading } = useAdminVerificationDetail(id);
  const { data: signedUrls, refetch: fetchSignedUrls, isFetching: isFetchingUrls } = useAdminSignedUrl(id);
  const approveMutation = useAdminApproveVerification();
  const rejectMutation = useAdminRejectVerification();

  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" color="primary.500" />
      </Flex>
    );
  }

  if (!verification) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="fg.muted">Verification not found.</Text>
      </Box>
    );
  }

  const statusColor = STATUS_COLORS[verification.status] ?? 'gray';
  const isPending = verification.status === 'PENDING';

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id, admin_notes: adminNotes || undefined });
      toaster.create({ title: 'Approved', description: 'Verification approved successfully.', type: 'success' });
      router.push('/admin/verifications');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve.';
      toaster.create({ title: 'Error', description: message, type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toaster.create({ title: 'Error', description: 'Rejection reason must be at least 10 characters.', type: 'error' });
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, rejection_reason: rejectionReason, admin_notes: adminNotes || undefined });
      toaster.create({ title: 'Rejected', description: 'Verification rejected. Vendor has been notified.', type: 'success' });
      router.push('/admin/verifications');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject.';
      toaster.create({ title: 'Error', description: message, type: 'error' });
    }
  };

  return (
    <Stack gap={8}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        color="fg.muted"
        w="fit-content"
        px={0}
        onClick={() => router.push('/admin/verifications')}
      >
        <LuArrowLeft size={14} /> Back to Verifications
      </Button>

      {/* Header */}
      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
            {verification.type} Verification
          </Heading>
          <Text textStyle="sm" color="fg.muted">
            ID: {verification.id}
          </Text>
        </Stack>
        <Box
          px={3}
          py={1}
          borderRadius="full"
          bg={`${statusColor}.subtle`}
        >
          <Text textStyle="sm" fontWeight="semibold" color={`${statusColor}.fg`}>
            {verification.status}
          </Text>
        </Box>
      </Flex>

      {/* Rejection reason (if rejected) */}
      {verification.rejection_reason && (
        <Alert.Root status="error" borderRadius="xl">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Rejection Reason</Alert.Title>
            <Alert.Description>{verification.rejection_reason}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
        {/* Left — Verification details */}
        <Box flex={1}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5} mb={4}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Submission Details
            </Text>
            <Stack gap={3}>
              <InfoRow label="Type" value={verification.type} />
              <InfoRow label="Submitted" value={new Date(verification.submitted_at).toLocaleString('en-NG')} />
              <InfoRow label="Reviewed at" value={verification.reviewed_at ? new Date(verification.reviewed_at).toLocaleString('en-NG') : undefined} />
              <InfoRow label="Admin notes" value={verification.admin_notes} />

              {/* NIN fields */}
              <InfoRow label="NIN Number" value={verification.nin_number} />
              <InfoRow label="Full Name (NIN)" value={verification.nin_full_name} />

              {/* CAC fields */}
              <InfoRow label="RC Number" value={verification.cac_rc_number} />
              <InfoRow label="Company Type" value={verification.cac_company_type} />

              {/* SMEDAN fields */}
              <InfoRow label="SUIN" value={verification.smedan_suin} />
              <InfoRow label="Business Type" value={verification.smedan_business_type} />
            </Stack>
          </Box>

          {/* Document signed URL */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Flex align="center" justify="space-between" mb={3}>
              <Text fontWeight="semibold" color="fg" textStyle="sm">
                Documents
              </Text>
              <Button
                size="xs"
                variant="outline"
                colorPalette="primary"
                loading={isFetchingUrls}
                onClick={() => fetchSignedUrls()}
              >
                Load Signed URLs
              </Button>
            </Flex>

            {signedUrls ? (
              <Stack gap={2}>
                {signedUrls.front_url && (
                  <a href={signedUrls.front_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <Button size="sm" variant="outline" colorPalette="primary" w="full">
                      View Front Document <LuExternalLink size={12} />
                    </Button>
                  </a>
                )}
                {signedUrls.back_url && (
                  <a href={signedUrls.back_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <Button size="sm" variant="outline" colorPalette="primary" w="full">
                      View Back Document <LuExternalLink size={12} />
                    </Button>
                  </a>
                )}
                {signedUrls.url && (
                  <a href={signedUrls.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <Button size="sm" variant="outline" colorPalette="primary" w="full">
                      View Certificate <LuExternalLink size={12} />
                    </Button>
                  </a>
                )}
              </Stack>
            ) : (
              <Text textStyle="xs" color="fg.subtle">
                Click "Load Signed URLs" to view the documents securely.
              </Text>
            )}
          </Box>
        </Box>

        {/* Right — Vendor info + Actions */}
        <Box w={{ base: 'full', md: '320px' }} flexShrink={0}>
          {/* Vendor info */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5} mb={4}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Vendor
            </Text>
            <Stack gap={3}>
              <InfoRow label="Email" value={(verification as any).vendor?.user?.email} />
              <InfoRow label="Vendor ID" value={verification.vendor_id} />
            </Stack>
          </Box>

          {/* Actions */}
          {isPending && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Admin Actions
              </Text>
              <Stack gap={3}>
                <Box>
                  <Text textStyle="xs" color="fg.muted" mb={1}>
                    Admin Notes (optional)
                  </Text>
                  <Textarea
                    placeholder="Internal notes visible to admins only…"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    size="sm"
                    rows={3}
                    colorPalette="primary"
                  />
                </Box>

                <Button
                  colorPalette="success"
                  size="md"
                  w="full"
                  onClick={handleApprove}
                  loading={approveMutation.isPending}
                  loadingText="Approving…"
                >
                  Approve Verification
                </Button>

                {!showRejectForm ? (
                  <Button
                    colorPalette="red"
                    variant="outline"
                    size="md"
                    w="full"
                    onClick={() => setShowRejectForm(true)}
                  >
                    Reject Verification
                  </Button>
                ) : (
                  <Stack gap={2}>
                    <Text textStyle="xs" color="fg.muted">
                      Rejection reason (required, min 10 chars)
                    </Text>
                    <Textarea
                      placeholder="Explain why this is being rejected…"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      size="sm"
                      rows={3}
                      colorPalette="red"
                    />
                    <Flex gap={2}>
                      <Button
                        colorPalette="red"
                        size="sm"
                        flex={1}
                        onClick={handleReject}
                        loading={rejectMutation.isPending}
                        loadingText="Rejecting…"
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Cancel
                      </Button>
                    </Flex>
                  </Stack>
                )}

                <MutationErrorAlert error={approveMutation.error ?? rejectMutation.error} />
              </Stack>
            </Box>
          )}
        </Box>
      </Flex>
    </Stack>
  );
}
