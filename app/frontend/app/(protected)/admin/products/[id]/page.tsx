'use client';
import { useState } from 'react';
import { use } from 'react';
import { Alert, Box, Button, Flex, Heading, Spinner, Stack, Text, Textarea } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import {
  useAdminProduct,
  useAdminFlagProduct,
  useAdminApproveProduct,
  useAdminArchiveProduct,
} from '@/app/_hooks/admin';
import { toaster } from '@/components/ui/toaster';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlertModal } from '@/components/ui/alert-modal';

function InfoRow({ label, value }: { label: string; value?: string | null | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <Flex gap={3}>
      <Text textStyle="sm" color="fg.muted" w="44" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color="fg" fontWeight="medium">
        {display}
      </Text>
    </Flex>
  );
}

function formatNaira(value: number) {
  return `₦${Number(value).toLocaleString('en-NG')}`;
}

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: product, isLoading } = useAdminProduct(id);
  const flagMutation = useAdminFlagProduct();
  const approveMutation = useAdminApproveProduct();
  const archiveMutation = useAdminArchiveProduct();

  const [flagReason, setFlagReason] = useState('');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false, title: '', description: '',
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40vh">
        <Spinner size="lg" color="primary.500" />
      </Flex>
    );
  }

  if (!product) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="fg.muted">Product not found.</Text>
      </Box>
    );
  }

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    try {
      await flagMutation.mutateAsync({ id, reason: flagReason.trim() });
      setFlagDialogOpen(false);
      setFlagReason('');
      toaster.create({ title: 'Product Flagged', description: 'Added to the quality review queue.', type: 'info' });
    } catch (error) {
      setFlagDialogOpen(false);
      const message = error instanceof Error ? error.message : 'Failed to flag product.';
      setErrorModal({ open: true, title: 'Flag Failed', description: message });
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id });
      toaster.create({ title: 'Product Approved', description: 'Flag cleared.', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve product.';
      setErrorModal({ open: true, title: 'Approval Failed', description: message });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({ id });
      setArchiveDialogOpen(false);
      toaster.create({ title: 'Product Archived', description: 'Removed from the public catalog.', type: 'success' });
      router.push('/admin/products');
    } catch (error) {
      setArchiveDialogOpen(false);
      const message = error instanceof Error ? error.message : 'Failed to archive product.';
      setErrorModal({ open: true, title: 'Archive Failed', description: message });
    }
  };

  const isArchived = !!product.deleted_at;

  return (
    <Stack gap={8}>
      <ConfirmDialog
        open={flagDialogOpen}
        onClose={() => setFlagDialogOpen(false)}
        onConfirm={handleFlag}
        title="Flag Product for Review"
        description="This product stays live in the catalog — flagging only adds it to the quality review queue."
        confirmLabel="Flag Product"
        colorPalette="red"
        isLoading={flagMutation.isPending}
        confirmDisabled={!flagReason.trim()}
      >
        <Textarea
          placeholder="Reason for flagging (e.g. suspected counterfeit, low-quality images)…"
          value={flagReason}
          onChange={(e) => setFlagReason(e.target.value)}
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        onConfirm={handleArchive}
        title="Archive Product"
        description={`Archive "${product.name}"? It will be removed from the public catalog. This can be reversed by the vendor.`}
        confirmLabel="Archive Product"
        colorPalette="red"
        isLoading={archiveMutation.isPending}
      />
      <AlertModal
        open={errorModal.open}
        onClose={() => setErrorModal((s) => ({ ...s, open: false }))}
        title={errorModal.title}
        description={errorModal.description}
        type="error"
      />

      <Button variant="ghost" size="sm" color="fg.muted" w="fit-content" px={0} onClick={() => router.push('/admin/products')}>
        <LuArrowLeft size={14} /> Back to Products
      </Button>

      <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
            {product.name}
          </Heading>
          <Flex align="center" gap={2}>
            <Box px={2} py={0.5} borderRadius="full" bg={isArchived ? 'red.subtle' : product.stock_status === 'OUT_OF_STOCK' ? 'warning.subtle' : 'success.subtle'}>
              <Text textStyle="xs" fontWeight="semibold" color={isArchived ? 'red.600' : product.stock_status === 'OUT_OF_STOCK' ? 'warning.fg' : 'success.fg'}>
                {isArchived ? 'Archived' : product.stock_status === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Active'}
              </Text>
            </Box>
            {product.is_flagged && (
              <Box px={2} py={0.5} borderRadius="full" bg="red.subtle">
                <Text textStyle="xs" fontWeight="semibold" color="red.600">
                  Flagged
                </Text>
              </Box>
            )}
          </Flex>
        </Stack>
      </Flex>

      {product.is_flagged && (
        <Alert.Root status="warning" borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Flagged for review</Alert.Title>
            <Alert.Description textStyle="xs">
              {product.flag_reason} — product remains visible to buyers while under review.
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Flex gap={6} flexDirection={{ base: 'column', md: 'row' }}>
        {/* Left — details */}
        <Stack gap={4} flex={1}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Product Details
            </Text>
            <Stack gap={3}>
              <InfoRow label="Vendor" value={product.vendor.business_name} />
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="Price" value={formatNaira(product.price)} />
              <InfoRow label="Stock Quantity" value={product.stock_quantity} />
              <InfoRow label="Description" value={product.description} />
              <InfoRow label="Created" value={new Date(product.created_at).toLocaleString('en-NG')} />
            </Stack>
          </Box>

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Sales Analytics
            </Text>
            <Stack gap={3}>
              <InfoRow label="Units Sold" value={product.analytics.units_sold} />
              <InfoRow label="Revenue" value={formatNaira(product.analytics.revenue)} />
            </Stack>
          </Box>

          {product.order_items.length > 0 && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
              <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
                Recent Orders
              </Text>
              <Stack gap={2}>
                {product.order_items.map((item) => (
                  <Flex key={item.id} align="center" justify="space-between">
                    <Text textStyle="sm" color="fg.muted">
                      {item.order.reference} · {item.quantity}x
                    </Text>
                    <Text textStyle="sm" color="fg">
                      {formatNaira(item.subtotal)}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Right — admin actions */}
        <Box w={{ base: 'full', md: '300px' }} flexShrink={0}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Text fontWeight="semibold" color="fg" textStyle="sm" mb={4}>
              Admin Actions
            </Text>
            <Stack gap={3}>
              {product.is_flagged ? (
                <Button colorPalette="success" size="md" w="full" onClick={handleApprove} loading={approveMutation.isPending}>
                  Approve / Clear Flag
                </Button>
              ) : (
                <Button colorPalette="warning" variant="outline" size="md" w="full" onClick={() => setFlagDialogOpen(true)}>
                  Flag for Review
                </Button>
              )}
              {!isArchived && (
                <Button colorPalette="red" variant="outline" size="md" w="full" onClick={() => setArchiveDialogOpen(true)}>
                  Archive Product
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
}
