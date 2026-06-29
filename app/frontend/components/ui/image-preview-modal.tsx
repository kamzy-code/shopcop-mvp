'use client';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react';

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
}

/** Lightweight single-image lightbox — click a thumbnail to open it full-size. */
export function ImagePreviewModal({ open, onClose, src, alt, title }: ImagePreviewModalProps) {
  return (
    <DialogRoot
      open={open}
      onOpenChange={({ open: isOpen }) => { if (!isOpen) onClose(); }}
      size="xl"
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogBackdrop />
      <DialogPositioner alignItems="center" px={4}>
        <DialogContent w="full" maxH="90vh" overflow="auto">
          <DialogCloseTrigger />
          <DialogHeader pb={0}>
            <DialogTitle textStyle="md" color="fg.muted">
              {title ?? 'Image Preview'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <img src={src} alt={alt} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
