'use client';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function StatusUpdateModal({
  open,
  onClose,
  onConfirm,
  actionLabel,
  isLoading,
  note,
  onNoteChange,
  refundAmount,
  onRefundAmountChange,
  refundVendorNotes,
  onRefundVendorNotesChange,
  showRefundFields,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionLabel: string;
  isLoading: boolean;
  note: string;
  onNoteChange: (v: string) => void;
  refundAmount?: string;
  onRefundAmountChange?: (v: string) => void;
  refundVendorNotes?: string;
  onRefundVendorNotesChange?: (v: string) => void;
  showRefundFields?: boolean;
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={actionLabel}
      description="Are you sure you want to proceed?"
      confirmLabel={actionLabel}
      colorPalette="primary"
      isLoading={isLoading}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Note (optional)
        </Text>
        <Textarea
          size="sm"
          rows={2}
          placeholder="Any notes about this status update..."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
        {showRefundFields && (
          <>
            <Text textStyle="xs" color="fg.muted" mb={1} mt={3}>
              Refund Amount (₦)
            </Text>
            <input
              type="number"
              min={0}
              placeholder="Enter refund amount..."
              value={refundAmount ?? ''}
              onChange={(e) => onRefundAmountChange?.(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--chakra-colors-border)',
                background: 'transparent',
                fontSize: '14px',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <Text textStyle="xs" color="fg.muted" mb={1} mt={3}>
              Refund Notes (internal)
            </Text>
            <Textarea
              size="sm"
              rows={2}
              placeholder="Internal notes about the refund..."
              value={refundVendorNotes ?? ''}
              onChange={(e) => onRefundVendorNotesChange?.(e.target.value)}
            />
          </>
        )}
      </Box>
    </ConfirmDialog>
  );
}
