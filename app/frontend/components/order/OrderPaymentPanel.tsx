'use client';
import { useState } from 'react';
import { Box, Button, Flex, Stack, Text, Textarea } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Order } from '@/app/_types';
import { formatDateTime } from '@/app/_lib/orderHelpers';

export const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; darkColor: string }
> = {
  UNPAID:          { label: 'Unpaid',          bg: 'gray.subtle',   color: 'gray.600',   darkColor: 'gray.300'   },
  PROOF_SUBMITTED: { label: 'Proof Submitted', bg: 'orange.subtle', color: 'orange.700', darkColor: 'orange.300' },
  PAID:            { label: 'Paid',            bg: 'green.subtle',  color: 'green.700',  darkColor: 'green.300'  },
  REFUNDED:        { label: 'Refunded',        bg: 'blue.subtle',   color: 'blue.700',   darkColor: 'blue.300'   },
};

function PaymentConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState('');
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => onConfirm(notes || undefined)}
      title="Confirm Payment"
      description="Confirming payment will mark this order as CONFIRMED and deduct stock from your catalog for linked products. This cannot be undone."
      confirmLabel="Confirm Payment"
      colorPalette="primary"
      isLoading={isLoading}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Payment notes (optional)
        </Text>
        <Textarea
          size="sm"
          rows={2}
          placeholder="e.g. Paid via transfer, ref #..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Box>
    </ConfirmDialog>
  );
}

export function OrderPaymentPanel({
  tx,
  showPaymentModal,
  onClosePaymentModal,
  onConfirmPayment,
  isConfirmingPayment,
  showReceiptModal,
  onOpenReceiptModal,
  onCloseReceiptModal,
}: {
  tx: Order;
  showPaymentModal: boolean;
  onClosePaymentModal: () => void;
  onConfirmPayment: (notes?: string) => void;
  isConfirmingPayment: boolean;
  showReceiptModal: boolean;
  onOpenReceiptModal: () => void;
  onCloseReceiptModal: () => void;
}) {
  return (
    <>
      <PaymentConfirmModal
        open={showPaymentModal}
        onClose={onClosePaymentModal}
        onConfirm={onConfirmPayment}
        isLoading={isConfirmingPayment}
      />

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
        <Text textStyle="xs" color="fg.muted" mb={3} fontWeight="medium">
          PAYMENT
        </Text>
        <Stack gap={2}>
          <Flex justify="space-between" align="center">
            <Text textStyle="sm" color="fg.muted">
              Status
            </Text>
            {(() => {
              const cfg = PAYMENT_STATUS_CONFIG[tx.payment_status] ?? PAYMENT_STATUS_CONFIG.UNPAID;
              return (
                <Box px={2} py={0.5} borderRadius="full" bg={cfg.bg} display="inline-flex">
                  <Text
                    textStyle="xs"
                    fontWeight="medium"
                    color={cfg.color}
                    _dark={{ color: cfg.darkColor }}
                  >
                    {cfg.label}
                  </Text>
                </Box>
              );
            })()}
          </Flex>

          {tx.payment_status === 'PROOF_SUBMITTED' && (
            <Box
              bg="orange.subtle"
              borderRadius="lg"
              p={3}
              borderWidth="1px"
              borderColor="orange.200"
              _dark={{ borderColor: 'orange.800' }}
            >
              <Text
                textStyle="sm"
                fontWeight="semibold"
                color="orange.700"
                _dark={{ color: 'orange.300' }}
              >
                Customer has sent payment
              </Text>
            </Box>
          )}

          {tx.payment_confirmed_at && (
            <Flex justify="space-between">
              <Text textStyle="sm" color="fg.muted">
                Confirmed at
              </Text>
              <Text textStyle="sm">{formatDateTime(tx.payment_confirmed_at)}</Text>
            </Flex>
          )}

          {tx.payment_proof_url ? (
            <Button
              size="xs"
              variant="outline"
              colorPalette="orange"
              w="full"
              onClick={onOpenReceiptModal}
            >
              View Receipt
            </Button>
          ) : tx.payment_status !== 'UNPAID' ? (
            <Text textStyle="xs" color="fg.muted">
              No receipt was uploaded — please check your bank to confirm payment.
            </Text>
          ) : null}

          {tx.payment_notes && (
            <Flex justify="space-between" align="flex-start" gap={4}>
              <Text textStyle="sm" color="fg.muted" flexShrink={0}>
                Notes
              </Text>
              <Text textStyle="sm" textAlign="right">
                {tx.payment_notes}
              </Text>
            </Flex>
          )}
        </Stack>
      </Box>

      {showReceiptModal && tx.payment_proof_url && (
        <Box
          position="fixed"
          inset={0}
          zIndex={200}
          bg="rgba(0,0,0,0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onCloseReceiptModal}
        >
          <Box position="relative" onClick={(e) => e.stopPropagation()}>
            <Flex justify="flex-end" mb={2}>
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={onCloseReceiptModal}
              >
                <LuX size={16} />
                Close
              </Button>
            </Flex>
            <img
              src={tx.payment_proof_url}
              alt="Payment receipt"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: '12px',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
