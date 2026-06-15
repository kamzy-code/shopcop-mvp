'use client';
import { useState } from 'react';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function OrderCancelModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => {
        if (isValid) onConfirm(reason);
      }}
      title="Cancel Order"
      description="This will cancel the order and restore any deducted stock."
      confirmLabel="Cancel Order"
      colorPalette="red"
      isLoading={isLoading}
      confirmDisabled={!isValid}
    >
      <Box mt={3}>
        <Text textStyle="xs" color="fg.muted" mb={1}>
          Reason (required, min 10 characters)
        </Text>
        <Textarea
          size="sm"
          rows={3}
          placeholder="Why is this order being cancelled?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {reason.length > 0 && !isValid && (
          <Text textStyle="2xs" color="red.500" mt={1}>
            At least 10 characters required
          </Text>
        )}
      </Box>
    </ConfirmDialog>
  );
}
