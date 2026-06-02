'use client';
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { ReviewStars } from './ReviewStars';
import type { Review as ReviewType } from '@/app/_types';
import { formatDate } from '@/app/_lib/transactionHelpers';

interface ReviewListProps {
  reviews: ReviewType[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function ReviewCard({ review }: { review: ReviewType }) {
  const displayName = review.buyer_name || 'Verified Buyer';

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

      {(review.delivery_rating || review.response_rating || review.satisfaction_rating) && (
        <Flex gap={4} mb={2} flexWrap="wrap">
          {review.delivery_rating && (
            <Flex align="center" gap={1}>
              <Text textStyle="2xs" color="fg.muted">Delivery:</Text>
              <ReviewStars rating={review.delivery_rating} size="sm" />
            </Flex>
          )}
          {review.response_rating && (
            <Flex align="center" gap={1}>
              <Text textStyle="2xs" color="fg.muted">Response:</Text>
              <ReviewStars rating={review.response_rating} size="sm" />
            </Flex>
          )}
          {review.satisfaction_rating && (
            <Flex align="center" gap={1}>
              <Text textStyle="2xs" color="fg.muted">Satisfaction:</Text>
              <ReviewStars rating={review.satisfaction_rating} size="sm" />
            </Flex>
          )}
        </Flex>
      )}

      {review.review_text && (
        <Text textStyle="sm" color="fg.muted" mt={1}>
          {review.review_text}
        </Text>
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
