'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Spinner,
  Stack,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { usePublicVendorProfile } from '@/app/_hooks/usePublicVendorProfile';
import { useVendorReviews } from '@/app/_hooks/reviews';
import { ProfileHeader } from '@/components/vendor/ProfileHeader';
import { TrustIndicators } from '@/components/vendor/TrustIndicators';
import { ReviewSummary } from '@/components/review/ReviewSummary';
import { ReviewList } from '@/components/review/ReviewList';
import { ProductsSection } from '@/components/vendor/ProductsSection';

// ─── Compact stat card ────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      p={3}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      textAlign="center"
    >
      <Text textStyle="xl" fontWeight="bold" color="fg" lineHeight="1.2">
        {value}
      </Text>
      <Text textStyle="2xs" color="fg.muted" mt={0.5} fontWeight="medium">
        {label}
      </Text>
    </Box>
  );
}

// ─── Review segment chip ──────────────────────────────────────────────────────

type Segment = 'all' | 'good' | 'neutral' | 'bad';

const SEGMENT_COLORS: Record<Segment, { active: string; text: string }> = {
  all: { active: 'primary', text: 'fg' },
  good: { active: 'green', text: 'green.700' },
  neutral: { active: 'warning', text: 'warning.700' },
  bad: { active: 'red', text: 'red.700' },
};

function SegmentChip({
  label,
  count,
  active,
  onClick,
  segment,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  segment: Segment;
}) {
  const colors = SEGMENT_COLORS[segment];
  return (
    <Button
      size="sm"
      variant={active ? 'solid' : 'outline'}
      colorPalette={active ? colors.active : 'gray'}
      onClick={onClick}
      borderRadius="full"
      fontWeight="medium"
    >
      {label}
      {count > 0 && (
        <Box
          as="span"
          ml={1}
          px={1.5}
          py={0.5}
          borderRadius="full"
          bg={active ? 'whiteAlpha.300' : 'bg.subtle'}
          textStyle="2xs"
          fontWeight="bold"
        >
          {count}
        </Box>
      )}
    </Button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorPublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [productPage, setProductPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [segment, setSegment] = useState<Segment>('all');

  const { data, isLoading, error } = usePublicVendorProfile(slug, 1, productPage);

  // Segment → rating bounds
  const segmentBounds: Record<Segment, [number | undefined, number | undefined]> = {
    all: [undefined, undefined],
    good: [4, 5],
    neutral: [3, 3],
    bad: [1, 2],
  };
  const [minRating, maxRating] = segmentBounds[segment];

  // Reviews fetched separately so segmentation doesn't reload the full profile
  const vendorId = data?.profile.id ?? '';
  const { data: reviewsData, isLoading: reviewsLoading } = useVendorReviews(
    vendorId,
    reviewPage,
    10,
    minRating,
    maxRating
  );

  if (isLoading) {
    return (
      <Flex minH="50dvh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error || !data) {
    return (
      <Flex minH="50dvh" align="center" justify="center">
        <Text color="fg.muted">Vendor not found</Text>
      </Flex>
    );
  }

  const { profile, trustMetrics, products } = data;

  // Use live reviews data; fall back to profile's initial reviews while loading
  const reviews = reviewsData ?? data.reviews;
  const summary = reviews.summary;

  const goodCount = (summary.distribution[4] ?? 0) + (summary.distribution[5] ?? 0);
  const neutralCount = summary.distribution[3] ?? 0;
  const badCount = (summary.distribution[1] ?? 0) + (summary.distribution[2] ?? 0);

  const filteredTotal = segment === 'all'
    ? summary.total_reviews
    : (reviews.summary.filtered_total ?? reviews.meta.total);

  return (
    <Box bg="bg" minH="100dvh">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border">
        <Box maxW="lg" mx="auto" px={4} py={6}>
          <ProfileHeader
            business_name={profile.business_name}
            profile_photo_url={profile.profile_photo_url}
            business_description={profile.business_description}
            state={profile.state}
            city={profile.city}
            primary_category={profile.primary_category}
            current_tier={profile.current_tier}
            payment_models={profile.payment_models}
            instagram_handle={profile.instagram_handle}
            tiktok_handle={profile.tiktok_handle}
            facebook_url={profile.facebook_url}
            whatsapp_number={profile.whatsapp_number}
            primary_contact={profile.primary_contact}
            refund_policy_type={profile.refund_policy_type}
            refund_duration_days={profile.refund_duration_days}
            refund_conditions={profile.refund_conditions}
            refund_custom_notes={profile.refund_custom_notes}
            created_at={profile.created_at}
          />
        </Box>
      </Box>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <Box maxW="lg" mx="auto" px={4}>
        <Stack gap={5} py={5} pb={12}>
          {/* Top 3 stat cards */}
          <SimpleGrid columns={3} gap={3}>
            <StatCard label="Completed" value={trustMetrics.successful_transactions} />
            <StatCard
              label="Avg Rating"
              value={trustMetrics.average_rating > 0 ? `${trustMetrics.average_rating.toFixed(1)} ★` : '—'}
            />
            <StatCard
              label="Fulfillment"
              value={`${Math.round(trustMetrics.fulfillment_rate)}%`}
            />
          </SimpleGrid>

          {/* Trust metrics */}
          <TrustIndicators metrics={trustMetrics} />

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <Tabs.Root defaultValue="products" variant="line">
            <Tabs.List>
              <Tabs.Trigger value="products">
                Products
                {products.meta.total > 0 && (
                  <Text as="span" textStyle="xs" color="fg.muted" ml={1}>
                    ({products.meta.total})
                  </Text>
                )}
              </Tabs.Trigger>
              <Tabs.Trigger value="reviews">
                Reviews
                {summary.total_reviews > 0 && (
                  <Text as="span" textStyle="xs" color="fg.muted" ml={1}>
                    ({summary.total_reviews})
                  </Text>
                )}
              </Tabs.Trigger>
            </Tabs.List>

            {/* Products tab */}
            <Tabs.Content value="products" pt={4}>
              <ProductsSection
                products={products.data}
                total={products.meta.total}
                page={productPage}
                totalPages={products.meta.totalPages}
                onPageChange={setProductPage}
              />
            </Tabs.Content>

            {/* Reviews tab */}
            <Tabs.Content value="reviews" pt={4}>
              {summary.total_reviews === 0 ? (
                <Box py={10} textAlign="center">
                  <Text color="fg.muted" textStyle="sm">
                    No reviews yet
                  </Text>
                </Box>
              ) : (
                <Stack gap={4}>
                  {/* Review summary (only in 'all' segment) */}
                  {segment === 'all' && <ReviewSummary summary={summary} />}

                  {/* Segmentation chips */}
                  <Flex gap={2} flexWrap="wrap">
                    <SegmentChip
                      label="All"
                      count={summary.total_reviews}
                      active={segment === 'all'}
                      segment="all"
                      onClick={() => { setSegment('all'); setReviewPage(1); }}
                    />
                    <SegmentChip
                      label="Good"
                      count={goodCount}
                      active={segment === 'good'}
                      segment="good"
                      onClick={() => { setSegment('good'); setReviewPage(1); }}
                    />
                    <SegmentChip
                      label="Neutral"
                      count={neutralCount}
                      active={segment === 'neutral'}
                      segment="neutral"
                      onClick={() => { setSegment('neutral'); setReviewPage(1); }}
                    />
                    <SegmentChip
                      label="Bad"
                      count={badCount}
                      active={segment === 'bad'}
                      segment="bad"
                      onClick={() => { setSegment('bad'); setReviewPage(1); }}
                    />
                  </Flex>

                  {/* Review list */}
                  {reviewsLoading ? (
                    <Flex justify="center" py={6}>
                      <Spinner size="md" />
                    </Flex>
                  ) : (
                    <ReviewList
                      reviews={reviews.data}
                      total={filteredTotal}
                      page={reviewPage}
                      totalPages={reviews.meta.totalPages}
                      onPageChange={setReviewPage}
                    />
                  )}
                </Stack>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Stack>
      </Box>
    </Box>
  );
}
