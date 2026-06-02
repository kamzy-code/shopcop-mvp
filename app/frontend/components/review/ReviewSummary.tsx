'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { ReviewStars } from './ReviewStars';
import type { ReviewSummary as ReviewSummaryType } from '@/app/_types';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const { average_rating, total_reviews, distribution } = summary;

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex gap={6} align="center" mb={4}>
        <Box textAlign="center">
          <Text textStyle="4xl" fontWeight="bold" lineHeight="1">
            {average_rating.toFixed(1)}
          </Text>
          <ReviewStars rating={Math.round(average_rating)} size="sm" />
          <Text textStyle="xs" color="fg.muted" mt={1}>
            {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
          </Text>
        </Box>

        <Box flex={1}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <Flex key={star} align="center" gap={2} mb={1}>
                <Text textStyle="xs" color="fg.muted" w={3}>
                  {star}
                </Text>
                <Box flex={1} h={2} bg="gray.100" _dark={{ bg: 'gray.700' }} borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    bg="yellow.400"
                    _dark={{ bg: 'yellow.300' }}
                    borderRadius="full"
                    width={`${pct}%`}
                    transition="width 0.3s"
                  />
                </Box>
                <Text textStyle="xs" color="fg.muted" w={6} textAlign="right">
                  {count}
                </Text>
              </Flex>
            );
          })}
        </Box>
      </Flex>
    </Box>
  );
}
