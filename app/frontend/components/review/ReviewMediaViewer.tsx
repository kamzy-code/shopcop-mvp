'use client';
import { useState } from 'react';
import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuX } from 'react-icons/lu';
import type { ReviewMedia } from '@/app/_types';

interface ReviewMediaViewerProps {
  media: ReviewMedia[];
  initialIndex?: number;
  onClose: () => void;
}

export function ReviewMediaViewer({ media, initialIndex = 0, onClose }: ReviewMediaViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const item = media[index];

  if (!item || media.length === 0) return null;

  const showNav = media.length > 1;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      bg="black/85"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        position="relative"
        maxW="90vw"
        maxH="90vh"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex
          position="absolute"
          top={-10}
          right={0}
          gap={2}
          zIndex={1}
        >
          {showNav && (
            <Text textStyle="xs" color="white" alignSelf="center">
              {index + 1} / {media.length}
            </Text>
          )}
          <Box
            as="button"
            w={8}
            h={8}
            borderRadius="full"
            bg="white/20"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            _hover={{ bg: 'white/30' }}
            onClick={onClose}
            aria-label="Close viewer"
          >
            <LuX size={18} />
          </Box>
        </Flex>

        {showNav && (
          <>
            <Box
              as="button"
              position="absolute"
              left={-12}
              top="50%"
              transform="translateY(-50%)"
              w={8}
              h={8}
              borderRadius="full"
              bg="white/20"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              _hover={{ bg: 'white/30' }}
              onClick={() => setIndex((prev) => (prev - 1 + media.length) % media.length)}
              aria-label="Previous media"
            >
              <LuChevronLeft size={18} />
            </Box>
            <Box
              as="button"
              position="absolute"
              right={-12}
              top="50%"
              transform="translateY(-50%)"
              w={8}
              h={8}
              borderRadius="full"
              bg="white/20"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="white"
              _hover={{ bg: 'white/30' }}
              onClick={() => setIndex((prev) => (prev + 1) % media.length)}
              aria-label="Next media"
            >
              <LuChevronRight size={18} />
            </Box>
          </>
        )}

        {item.media_type === 'VIDEO' ? (
          <video
            src={item.media_url}
            controls
            autoPlay
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              display: 'block',
            }}
          />
        ) : (
          <img
            src={item.media_url}
            alt="Review media"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '12px',
              display: 'block',
            }}
          />
        )}
      </Box>
    </Box>
  );
}
