'use client';
import { useState } from 'react';
import { Box, Button, Flex, Grid, Stack, Text } from '@chakra-ui/react';
import { ReviewStars } from './ReviewStars';
import type { Review as ReviewType } from '@/app/_types';
import { formatDate } from '@/app/_lib/orderHelpers';
import { ReviewMediaViewer } from './ReviewMediaViewer';

interface ReviewListProps {
  reviews: ReviewType[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function ReviewCard({ review }: { review: ReviewType }) {
  const displayName = review.buyer_name || 'Verified Buyer';
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  return (
    <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex justify="space-between" align="flex-start" mb={2}>
        <Box>
          <Text textStyle="sm" fontWeight="semibold">
            {displayName}
          </Text>
          <Text textStyle="xs" color="fg.muted">
            {formatDate(review.created_at)}
          </Text>
        </Box>
        <ReviewStars rating={review.overall_rating} size="sm" />
      </Flex>

      {review.review_text && (
        <Text textStyle="sm" color="fg.muted" mt={1}>
          {review.review_text}
        </Text>
      )}

      {review.media && review.media.length > 0 && (
        <Flex gap={2} mt={3} flexWrap="wrap">
          {review.media.map((m, i) => (
            <Box
              key={m.id}
              w={16}
              h={16}
              borderRadius="md"
              overflow="hidden"
              cursor="pointer"
              flexShrink={0}
              borderWidth="1px"
              borderColor="border"
              onClick={() => setViewerIndex(i)}
            >
              {m.media_type === 'VIDEO' ? (
                <video
                  src={m.media_url}
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={m.media_url}
                  alt="Review media"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </Box>
          ))}
        </Flex>
      )}

      {viewerIndex !== null && (
        <ReviewMediaViewer
          media={review.media}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </Box>
  );
}

export function ReviewList({ reviews, total, page, totalPages, onPageChange }: ReviewListProps) {
  if (total === 0) {
    return (
      <Box p={4} textAlign="center" color="fg.muted">
        <Text textStyle="sm">No reviews yet</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Stack gap={3}>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </Stack>

      {totalPages > 1 && (
        <Flex justify="center" gap={2} mt={4}>
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Text textStyle="sm" alignSelf="center" color="fg.muted">
            Page {page} of {totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </Flex>
      )}
    </Box>
  );
}
