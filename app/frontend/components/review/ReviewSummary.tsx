'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { ReviewSummary as ReviewSummaryType } from '@/app/_types';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
  averageRating?: number;
}

export function ReviewSummary({ summary, averageRating }: ReviewSummaryProps) {
  const { total_reviews, distribution } = summary;
  const avg =
    averageRating ??
    (total_reviews > 0
      ? ((distribution[1] || 0) * 1 +
          (distribution[2] || 0) * 2 +
          (distribution[3] || 0) * 3 +
          (distribution[4] || 0) * 4 +
          (distribution[5] || 0) * 5) /
        total_reviews
      : 0);
  return (
    <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex gap={6} align="center" mb={4}>
        <Box textAlign="center" minW={20}>
          <Text textStyle="xs" color="fg.muted" fontWeight="medium" mb={1}>
            Avg Rating
          </Text>
          <Text textStyle="2xl" fontWeight="bold" color="fg" lineHeight="1.1">
            {avg > 0 ? avg.toFixed(1) : '—'}
            <Text as="span" color="yellow.400" _dark={{ color: 'yellow.300' }}>
              ★
            </Text>
          </Text>
          <Text textStyle="xs" color="fg.muted" mt={1.5}>
            {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
          </Text>
        </Box>

        <Box flex={1}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            // Width proportional to total reviews so bars reflect true distribution
            const pct = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
            return (
              <Flex key={star} align="center" gap={2} mb={1}>
                <Text textStyle="xs" color="fg.muted" w={3}>
                  {star}
                </Text>
                <Box
                  flex={1}
                  h={2}
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  borderRadius="full"
                  overflow="hidden"
                >
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
