'use client';
import { Box, Button, Flex, Spinner, Text } from '@chakra-ui/react';
import { LuImage, LuX } from 'react-icons/lu';
import { UploadResult } from '@/app/_hooks/upload';
import { toaster } from '@/components/ui/toaster';

interface ImageSlotProps {
  index: number;
  file: UploadResult | null;
  localUrl?: string;
  isUploading?: boolean;
  onAdd: (index: number, file: File) => void;
  onRemove: (index: number) => void;
  isPrimary: boolean;
  accept?: string;
}

export function ImageSlot({
  index,
  file,
  localUrl,
  isUploading,
  onAdd,
  onRemove,
  isPrimary,
  accept = 'image/jpeg,image/jpg,image/png,video/mp4,video/quicktime,video/webm',
}: ImageSlotProps) {
  const preview = localUrl || file?.url || null;
  const hasContent = !!preview;

  const handleClick = () => {
    if (isUploading || hasContent) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) {
        toaster.create({ title: 'File must be under 10MB', type: 'error' });
        return;
      }
      onAdd(index, f);
    };
    input.click();
  };

  return (
    <Box
      w="full"
      aspectRatio={1}
      borderRadius="xl"
      borderWidth="2px"
      borderStyle={hasContent ? 'solid' : 'dashed'}
      borderColor={hasContent ? 'primary.300' : 'border'}
      bg={hasContent ? 'transparent' : 'bg.subtle'}
      position="relative"
      overflow="hidden"
      cursor={isUploading || hasContent ? 'default' : 'pointer'}
      transition="all 0.15s"
      onClick={handleClick}
      _hover={isUploading || hasContent ? {} : { borderColor: 'primary.400', bg: 'primary.subtle' }}
    >
      {preview ? (
        <>
          {file?.resourceType === 'video' ? (
            <video
              src={preview}
              controls
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={preview}
              alt={`Product image ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {isPrimary && (
            <Box position="absolute" bottom={1} left={1} px={1.5} py={0.5} borderRadius="md" bg="primary.500">
              <Text textStyle="2xs" color="white" fontWeight="bold">Primary</Text>
            </Box>
          )}
          <Button
            position="absolute"
            top={1}
            right={1}
            size="xs"
            colorPalette="red"
            borderRadius="full"
            w={5}
            h={5}
            minW={5}
            p={0}
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            aria-label="Remove image"
          >
            <LuX size={10} />
          </Button>
        </>
      ) : (
        <Flex direction="column" align="center" justify="center" h="full" gap={1} p={3}>
          <LuImage size={20} color="var(--chakra-colors-fg-subtle)" />
          {index === 0 && (
            <Text textStyle="2xs" color="fg.muted" textAlign="center">Primary</Text>
          )}
        </Flex>
      )}
      {isUploading && (
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.400"
          borderRadius="xl"
          zIndex={1}
        >
          <Spinner size="lg" color="white" />
        </Box>
      )}
    </Box>
  );
}
