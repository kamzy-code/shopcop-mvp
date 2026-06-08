'use client';
import { useEffect, useState } from 'react';
import { Box, Button, Flex, Input, Stack, Text } from '@chakra-ui/react';
import { useParams, useRouter } from 'next/navigation';
import { LuCheck, LuCopy, LuPackage, LuStore } from 'react-icons/lu';
import { useOrderByToken, useSubmitPaymentProof } from '@/app/_hooks/order';
import { useUploadPublicMedia } from '@/app/_hooks/upload';
import { FileUpload } from '@/components/shared/fileUpload';
import FullPageSpinner from '@/components/shared/fullPageSpinner';
import { formatCurrency, isVideoUrl } from '@/app/_lib/orderHelpers';
import { Order, OrderVendor } from '@/app/_types';
import { toaster } from '@/components/ui/toaster';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };
  return (
    <Button size="xs" variant="outline" colorPalette="gray" onClick={handleCopy} flexShrink={0}>
      {copied ? <LuCheck size={11} /> : <LuCopy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const { data: tx, isLoading } = useOrderByToken(token);

  const [email, setEmail] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const uploadMutation = useUploadPublicMedia();
  const submitMutation = useSubmitPaymentProof(token);

  // Redirect away once payment is no longer UNPAID
  useEffect(() => {
    if (tx && tx.payment_status !== 'UNPAID') {
      router.replace(`/track/${token}`);
    }
  }, [tx, token, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!tx || tx.payment_status !== 'UNPAID') return null;

  const vendor = tx.vendor as OrderVendor;
  const hasPaymentDetails = vendor?.bank_name || vendor?.account_number || vendor?.account_name;

  const handleSubmit = async () => {
    if (!receiptFile) {
      toaster.create({
        title: 'Receipt required',
        description: 'Please upload a screenshot of your payment receipt before submitting.',
        type: 'error',
      });
      return;
    }

    let payment_proof_url: string;
    try {
      const result = await uploadMutation.mutateAsync({ file: receiptFile, setUploadProgress });
      payment_proof_url = result.url;
    } catch {
      toaster.create({
        title: 'Upload failed',
        description: 'Could not upload your receipt. Please try again.',
        type: 'error',
      });
      return;
    }

    try {
      await submitMutation.mutateAsync({
        buyer_email: email.trim() || undefined,
        payment_proof_url,
      });
      router.push(`/track/${token}`);
    } catch {
      toaster.create({
        title: 'Something went wrong',
        description: 'Could not submit your payment. Please try again.',
        type: 'error',
      });
    }
  };

  const isSubmitting = submitMutation.isPending || uploadMutation.isPending;
  const canSubmit = !!receiptFile && !isSubmitting;

  return (
    <Box minH="100dvh" bg="bg">
      {/* Brand header */}
      <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border" px={4} py={3}>
        <Flex align="center" justify="space-between" maxW="520px" mx="auto">
          <Flex align="center" gap={2}>
            <Flex
              w={7}
              h={7}
              borderRadius="md"
              bg="primary.500"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuStore size={14} color="white" />
            </Flex>
            <Text fontWeight="bold" textStyle="sm" color="fg">
              ShopCop
            </Text>
          </Flex>
          {vendor?.business_name && (
            <Text textStyle="sm" color="fg.muted">
              by {vendor.business_name}
            </Text>
          )}
        </Flex>
      </Box>

      {/* Content */}
      <Box maxW="520px" mx="auto" px={4} py={6}>
        <Stack gap={4}>
          {/* Page heading */}
          <Box>
            <Text textStyle="xl" fontWeight="bold" color="fg">
              Complete Checkout
            </Text>
            <Text textStyle="sm" color="fg.muted" mt={0.5}>
              {`Transfer the amount below to the seller's account, then tap "I've sent the money"`}
            </Text>
          </Box>

          {/* Payment details */}
          {hasPaymentDetails && (
            <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
              <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
                PAYMENT DETAILS
              </Text>
              <Stack gap={3}>
                {vendor?.bank_name && (
                  <Flex justify="space-between" align="center">
                    <Text textStyle="sm" color="fg.muted">
                      Bank
                    </Text>
                    <Text textStyle="sm" fontWeight="medium">
                      {vendor.bank_name}
                    </Text>
                  </Flex>
                )}
                {vendor?.account_number && (
                  <Flex justify="space-between" align="center" gap={2}>
                    <Text textStyle="sm" color="fg.muted" flexShrink={0}>
                      Account Number
                    </Text>
                    <Flex align="center" gap={2}>
                      <Text textStyle="sm" fontWeight="bold" fontFamily="mono">
                        {vendor.account_number}
                      </Text>
                      <CopyButton text={vendor.account_number} />
                    </Flex>
                  </Flex>
                )}
                {vendor?.account_name && (
                  <Flex justify="space-between" align="center">
                    <Text textStyle="sm" color="fg.muted">
                      Account Name
                    </Text>
                    <Text textStyle="sm" fontWeight="medium">
                      {vendor.account_name}
                    </Text>
                  </Flex>
                )}
                <Box borderTopWidth="1px" borderColor="border" pt={3}>
                  <Flex justify="space-between" align="center">
                    <Text textStyle="sm" fontWeight="semibold" color="fg">
                      Amount to send
                    </Text>
                    <Text textStyle="lg" fontWeight="bold" color="primary.fg">
                      {formatCurrency(tx.total_amount)}
                    </Text>
                  </Flex>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Order summary */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Flex align="baseline" gap={1.5} mb={3}>
              <Text textStyle="xs" color="fg.muted" fontWeight="medium">
                ORDER SUMMARY
              </Text>
              <Text textStyle="2xs" color="fg.subtle" fontFamily="mono">
                {tx.reference}
              </Text>
            </Flex>
            <Stack gap={2.5}>
              {(tx.items as Order['items']).map((item, i) => (
                <Flex key={i} align="center" gap={2.5}>
                  <Box
                    w={8}
                    h={8}
                    borderRadius="md"
                    bg="bg.subtle"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    {item.item_image_url ? (
                      isVideoUrl(item.item_image_url) ? (
                        <video
                          src={item.item_image_url}
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <img
                          src={item.item_image_url}
                          alt={item.item_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )
                    ) : (
                      <Flex h="full" align="center" justify="center" color="fg.subtle">
                        <LuPackage size={12} />
                      </Flex>
                    )}
                  </Box>
                  <Text textStyle="sm" flex={1} truncate>
                    {item.item_name}
                    {item.quantity > 1 && (
                      <Text as="span" color="fg.muted">
                        {' '}
                        ×{item.quantity}
                      </Text>
                    )}
                  </Text>
                  <Text textStyle="sm" fontWeight="medium" flexShrink={0}>
                    {formatCurrency(item.subtotal)}
                  </Text>
                </Flex>
              ))}
              {(tx.delivery_fee != null && tx.delivery_fee > 0) && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Delivery fee
                  </Text>
                  <Text textStyle="sm" color="fg.muted">
                    {formatCurrency(tx.delivery_fee)}
                  </Text>
                </Flex>
              )}
              {(tx.discount_amount != null && tx.discount_amount > 0) && (
                <Flex justify="space-between">
                  <Text textStyle="sm" color="fg.muted">
                    Discount
                  </Text>
                  <Text textStyle="sm" color="green.600" _dark={{ color: 'green.400' }}>
                    -{formatCurrency(tx.discount_amount)}
                  </Text>
                </Flex>
              )}
              <Box borderTopWidth="1px" borderColor="border" pt={2}>
                <Flex justify="space-between">
                  <Text textStyle="md" fontWeight="bold">
                    Total
                  </Text>
                  <Text textStyle="md" fontWeight="bold" color="primary.fg">
                    {formatCurrency(tx.total_amount)}
                  </Text>
                </Flex>
              </Box>
            </Stack>
          </Box>

          {/* Upload receipt */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Flex align="center" gap={1} mb={0.5}>
              <Text textStyle="sm" fontWeight="medium" color="fg">
                Payment receipt
              </Text>
              <Text textStyle="xs" color="red.500" fontWeight="semibold">*</Text>
            </Flex>
            <Text textStyle="xs" color="fg.muted" mb={3}>
              Required — upload a screenshot or photo of your payment confirmation
            </Text>
            <FileUpload
              accept="image/*"
              maxSizeMB={5}
              onFileSelect={setReceiptFile}
              label="Upload receipt screenshot"
              hint="PNG, JPG or WEBP · max 5MB"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Text textStyle="xs" color="fg.muted" mt={2}>
                Uploading… {uploadProgress}%
              </Text>
            )}
          </Box>

          {/* Email */}
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
            <Text textStyle="sm" fontWeight="medium" color="fg" mb={0.5}>
              Get order updates via email
            </Text>
            <Text textStyle="xs" color="fg.muted" mb={3}>
              {`Optional — we'll notify you when your order status changes`}
            </Text>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
            />
          </Box>

          {/* Submit */}
          <ConfirmDialog
            open={showConfirm}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => { setShowConfirm(false); handleSubmit(); }}
            title="Confirm Payment"
            description={`Please confirm that you have sent ${formatCurrency(tx.total_amount)} to ${vendor?.account_name ?? 'the seller'}. Once submitted, the seller will verify your payment before processing your order.`}
            confirmLabel="Yes, I've Sent It"
            colorPalette="primary"
            isLoading={isSubmitting}
          />

          <Button
            colorPalette="primary"
            size="lg"
            w="full"
            onClick={() => setShowConfirm(true)}
            loading={isSubmitting}
            disabled={!canSubmit}
            loadingText={uploadMutation.isPending ? 'Uploading receipt…' : 'Submitting…'}
          >
            {`I've Sent the Money`}
          </Button>

          {/* Footer */}
          <Text textStyle="xs" color="fg.subtle" textAlign="center">
            Powered by ShopCop · Verified Nigerian Vendors
          </Text>
        </Stack>
      </Box>
    </Box>
  );
}
