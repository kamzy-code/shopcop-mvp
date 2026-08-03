'use client';
import { Box, Grid, Text } from '@chakra-ui/react';
import { UploadResult } from '@/app/_hooks/upload';
import { ImageSlot } from './ImageSlot';

interface ProductMediaUploadProps {
  mediaFiles: (UploadResult | null)[];
  localPreviews: Record<number, string>;
  uploadingSlots: Record<number, boolean>;
  uploadProgress?: Record<number, number>;
  onAdd: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  label?: string;
  description?: string;
}

export function ProductMediaUpload({
  mediaFiles,
  localPreviews,
  uploadingSlots,
  uploadProgress = {},
  onAdd,
  onRemove,
  label = 'Product Images *',
  description = 'Upload up to 5 images or videos. The first image is the primary display image. Max 25MB each.',
}: ProductMediaUploadProps) {
  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Text fontWeight="semibold" color="fg" textStyle="sm" mb={1}>{label}</Text>
      <Text color="fg.muted" textStyle="xs" mb={4}>{description}</Text>
      <Grid templateColumns="repeat(5, 1fr)" gap={3}>
        {mediaFiles.map((file, index) => (
          <ImageSlot
            key={index}
            index={index}
            file={file}
            localUrl={localPreviews[index]}
            isUploading={uploadingSlots[index]}
            uploadProgress={uploadProgress[index]}
            onAdd={onAdd}
            onRemove={onRemove}
            isPrimary={index === 0 && !!file}
          />
        ))}
      </Grid>
    </Box>
  );
}
