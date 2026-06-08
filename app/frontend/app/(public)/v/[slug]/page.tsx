'use client';
import { useState } from 'react';
import { Box, Flex, Spinner, Stack, Tabs, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { usePublicVendorProfile } from '@/app/_hooks/usePublicVendorProfile';
import { useVendorReviews } from '@/app/_hooks/reviews';
import { ProfileHeader } from '@/components/vendor/ProfileHeader';
import { CustomerFeedbackStats } from '@/components/vendor/TrustIndicators';
import { ReviewList } from '@/components/review/ReviewList';
import { ProductsSection } from '@/components/vendor/ProductsSection';
import { PublicNavbar } from '@/components/shared/PublicNavbar';

// ─── Review segment pill ──────────────────────────────────────────────────────

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
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useVendorReviews(vendorId, reviewPage, 10, minRating, maxRating);

  if (isLoading) {
    return (
      <Flex minH="50dvh" align="center" justify="center">
        <Spinner size="xl" colorPalette="primary" />
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

  //const unfilteredTotal = (summary.distribution[1] ?? 0) + (summary.distribution[2] ?? 0) + (summary.distribution[3] ?? 0) + (summary.distribution[4] ?? 0) + (summary.distribution[5] ?? 0);
  const unfilteredTotal = Object.values(summary.distribution).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );
  const goodCount = (summary.distribution[4] ?? 0) + (summary.distribution[5] ?? 0);
  const neutralCount = summary.distribution[3] ?? 0;
  const badCount = (summary.distribution[1] ?? 0) + (summary.distribution[2] ?? 0);

  const filteredTotal = reviews.meta.total;

  const contentMaxW = { base: 'full', md: '2xl', lg: '4xl' };

  return (
    <Box bg="bg" minH="100dvh">
      <PublicNavbar businessName={profile.business_name} maxW={contentMaxW} />
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border">
        <Box maxW={contentMaxW} mx="auto" px={{ base: 4, md: 6 }} py={6}>
          <ProfileHeader
            business_name={profile.business_name}
            profile_photo_url={profile.profile_photo_url}
            business_description={profile.business_description}
            state={profile.state}
            city={profile.city}
            street_address={profile.street_address}
            landmark={profile.landmark}
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
            trustMetrics={trustMetrics}
          />
        </Box>
      </Box>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <Box maxW={contentMaxW} mx="auto" px={{ base: 4, md: 6 }}>
        <Stack gap={6} py={5} pb={12}>
          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <Tabs.Root defaultValue="products" variant="line" colorPalette="primary">
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
                slug={slug}
              />
            </Tabs.Content>

            {/* Reviews tab */}
            <Tabs.Content value="reviews" pt={4}>
              {unfilteredTotal === 0 ? (
                <Box py={10} textAlign="center">
                  <Text color="fg.muted" textStyle="sm">
                    No reviews yet
                  </Text>
                </Box>
              ) : (
                <Stack gap={4}>
                  {/* Customer feedback ratings */}
                  <CustomerFeedbackStats metrics={trustMetrics} />

                  {/* Segment pills — always visible so user can switch segments */}
                  <Flex gap={2} flexWrap="wrap">
                    <SegmentPill
                      label="All"
                      count={unfilteredTotal}
                      segment="all"
                      active={segment === 'all'}
                      onClick={() => {
                        setSegment('all');
                        setReviewPage(1);
                      }}
                    />
                    <SegmentPill
                      label="Good"
                      count={goodCount}
                      segment="good"
                      active={segment === 'good'}
                      onClick={() => {
                        setSegment('good');
                        setReviewPage(1);
                      }}
                    />
                    <SegmentPill
                      label="Neutral"
                      count={neutralCount}
                      segment="neutral"
                      active={segment === 'neutral'}
                      onClick={() => {
                        setSegment('neutral');
                        setReviewPage(1);
                      }}
                    />
                    <SegmentPill
                      label="Bad"
                      count={badCount}
                      segment="bad"
                      active={segment === 'bad'}
                      onClick={() => {
                        setSegment('bad');
                        setReviewPage(1);
                      }}
                    />
                  </Flex>

                  {/* Review list */}
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
                  ) : filteredTotal === 0 ? (
                    <Box py={6} textAlign="center">
                      <Text color="fg.muted" textStyle="sm">
                        No reviews match this segment
                      </Text>
                    </Box>
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
