'use client';
import { useState } from 'react';
import { Box, Flex, Spinner, Stack, Text } from '@chakra-ui/react';
import { useVendorProfile } from '@/app/_hooks/vendor';
import { useVendorReviews } from '@/app/_hooks/reviews';
import { ReviewList } from '@/components/review/ReviewList';
import { ReviewSummary } from '@/components/review/ReviewSummary';

type Segment = 'all' | 'good' | 'neutral' | 'bad';

const SEGMENT_COLORS: Record<Segment, string> = {
  all: 'primary',
  good: 'success',
  neutral: 'warning',
  bad: 'red',
};

function SegmentPill({
  label,
  count,
  segment,
  active,
  onClick,
}: {
  label: string;
  count: number;
  segment: Segment;
  active: boolean;
  onClick: () => void;
}) {
  const palette = SEGMENT_COLORS[segment];
  return (
    <Box
      as="button"
      onClick={onClick}
      px={3}
      py={1}
      borderRadius="full"
      textStyle="xs"
      fontWeight="medium"
      cursor="pointer"
      transition="all 0.15s"
      bg={active ? `${palette}.solid` : 'bg.subtle'}
      color={active ? 'white' : 'fg.muted'}
      _hover={{ bg: active ? `${palette}.solid` : 'bg.muted' }}
      flexShrink={0}
    >
      {label}
      {count > 0 ? ` · ${count}` : ''}
    </Box>
  );
}

const segmentBounds: Record<Segment, [number | undefined, number | undefined]> = {
  all: [undefined, undefined],
  good: [4, 5],
  neutral: [3, 3],
  bad: [1, 2],
};

export default function VendorReviewsPage() {
  const [segment, setSegment] = useState<Segment>('all');
  const [page, setPage] = useState(1);

  const { data: profile, isLoading: profileLoading } = useVendorProfile();
  const vendorId = profile?.id ?? '';

  const [minRating, maxRating] = segmentBounds[segment];

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useVendorReviews(vendorId, page, 10, minRating, maxRating);

  const summary = reviewsData?.summary;
  const unfilteredTotal = summary
    ? Object.values(summary.distribution).reduce((sum, count) => sum + (count ?? 0), 0)
    : 0;
  const goodCount = summary ? (summary.distribution[4] ?? 0) + (summary.distribution[5] ?? 0) : 0;
  const neutralCount = summary?.distribution[3] ?? 0;
  const badCount = summary ? (summary.distribution[1] ?? 0) + (summary.distribution[2] ?? 0) : 0;

  if (profileLoading || reviewsLoading) {
    return (
      <Flex minH="50dvh" align="center" justify="center">
        <Spinner size="xl" colorPalette="primary" />
      </Flex>
    );
  }

  if (!vendorId) {
    return (
      <Flex minH="50dvh" align="center" justify="center">
        <Text color="fg.muted" textStyle="sm">
          Could not load vendor profile
        </Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Box>
        <Text textStyle="2xl" fontWeight="bold" color="fg">
          Reviews
        </Text>
        <Text textStyle="sm" color="fg.muted" mt={1}>
          See what buyers are saying about your store.
        </Text>
      </Box>

      {unfilteredTotal === 0 && !reviewsLoading ? (
        <Box py={10} textAlign="center">
          <Text color="fg.muted" textStyle="sm">
            No reviews yet
          </Text>
        </Box>
      ) : (
        <Stack gap={4}>
          {summary && (
            <ReviewSummary
              summary={{ total_reviews: unfilteredTotal, distribution: summary.distribution }}
              averageRating={profile?.average_rating}
            />
          )}

          <Flex gap={2} flexWrap="wrap">
            <SegmentPill
              label="All"
              count={unfilteredTotal}
              segment="all"
              active={segment === 'all'}
              onClick={() => {
                setSegment('all');
                setPage(1);
              }}
            />
            <SegmentPill
              label="Good"
              count={goodCount}
              segment="good"
              active={segment === 'good'}
              onClick={() => {
                setSegment('good');
                setPage(1);
              }}
            />
            <SegmentPill
              label="Neutral"
              count={neutralCount}
              segment="neutral"
              active={segment === 'neutral'}
              onClick={() => {
                setSegment('neutral');
                setPage(1);
              }}
            />
            <SegmentPill
              label="Bad"
              count={badCount}
              segment="bad"
              active={segment === 'bad'}
              onClick={() => {
                setSegment('bad');
                setPage(1);
              }}
            />
          </Flex>

          {reviewsLoading ? (
            <Flex justify="center" py={6}>
              <Spinner size="md" colorPalette="primary" />
            </Flex>
          ) : reviewsError ? (
            <Box py={6} textAlign="center">
              <Text color="fg.muted" textStyle="sm">
                Error loading reviews
              </Text>
            </Box>
          ) : reviewsData?.meta.total === 0 ? (
            <Box py={6} textAlign="center">
              <Text color="fg.muted" textStyle="sm">
                No reviews match this segment
              </Text>
            </Box>
          ) : reviewsData ? (
            <ReviewList
              reviews={reviewsData.data}
              total={reviewsData.meta.total}
              page={page}
              totalPages={reviewsData.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}
