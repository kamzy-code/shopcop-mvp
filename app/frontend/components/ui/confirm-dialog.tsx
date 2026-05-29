'use client';
import {
  Button,
  DialogActionTrigger,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Text,
} from '@chakra-ui/react';
import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  colorPalette?: string;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  colorPalette = 'red',
  isLoading = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  return (
    <DialogRoot
      role="alertdialog"
      open={open}
      onOpenChange={({ open: isOpen }) => { if (!isOpen) onClose(); }}
      size="sm"
    >
      <DialogBackdrop />
      <DialogPositioner alignItems="center" px={4}>
        <DialogContent w="full">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            {description && (
              <Text textStyle="sm" color="fg.muted" mb={children ? 4 : 0}>
                {description}
              </Text>
            )}
            {children}
          </DialogBody>

          <DialogFooter gap={3}>
            <DialogActionTrigger asChild>
              <Button variant="outline" colorPalette="gray" size="md" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette={colorPalette}
              size="md"
              loading={isLoading}
              disabled={confirmDisabled || isLoading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
