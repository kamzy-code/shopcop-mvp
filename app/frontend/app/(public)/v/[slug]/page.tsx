'use client';
import { useState } from 'react';
import { Box, Container, Flex, Spinner, Stack, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { usePublicVendorProfile } from '@/app/_hooks/usePublicVendorProfile';
import { ProfileHeader } from '@/components/vendor/ProfileHeader';
import { MetricsCard } from '@/components/vendor/MetricsCard';
import { TrustIndicators } from '@/components/vendor/TrustIndicators';
import { ReviewSummary } from '@/components/review/ReviewSummary';
import { ReviewList } from '@/components/review/ReviewList';
import { ProductsSection } from '@/components/vendor/ProductsSection';

export default function VendorPublicProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [reviewPage, setReviewPage] = useState(1);
  const [productPage, setProductPage] = useState(1);

  const { data, isLoading, error } = usePublicVendorProfile(slug, reviewPage, productPage);

  if (isLoading) {
    return (
      <Container maxW="4xl" py={8}>
        <Flex justify="center" py={20}>
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxW="4xl" py={8}>
        <Box p={8} textAlign="center">
          <Text color="fg.muted">Vendor not found</Text>
        </Box>
      </Container>
    );
  }

  const { profile, trustMetrics, reviews, products } = data;

  return (
    <Container maxW="4xl" py={6}>
      <Stack gap={6}>
        <ProfileHeader
          business_name={profile.business_name}
          profile_photo_url={profile.profile_photo_url}
          business_description={profile.business_description}
          state={profile.state}
          city={profile.city}
          primary_category={profile.primary_category}
          current_tier={profile.current_tier}
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

        <Flex gap={3} flexWrap="wrap">
          <MetricsCard
            label="Total Orders"
            value={trustMetrics.total_transactions}
            icon="transactions"
          />
          <MetricsCard
            label="Completed"
            value={trustMetrics.successful_transactions}
            icon="fulfillment"
          />
          <MetricsCard
            label="Rating"
            value={trustMetrics.average_rating.toFixed(1)}
            icon="rating"
          />
          <MetricsCard
            label="Refund Rate"
            value={`${trustMetrics.refund_rate}%`}
            icon="refund"
          />
        </Flex>

        <TrustIndicators metrics={trustMetrics} />

        {reviews.data.length > 0 && (
          <Box>
            <Text textStyle="sm" fontWeight="semibold" mb={3}>
              Reviews
            </Text>
            <ReviewSummary summary={reviews.summary} />
            <Box mt={3}>
              <ReviewList
                reviews={reviews.data}
                total={reviews.meta.total}
                page={reviewPage}
                totalPages={reviews.meta.totalPages}
                onPageChange={setReviewPage}
              />
            </Box>
          </Box>
        )}

        <ProductsSection
          products={products.data}
          total={products.meta.total}
          page={productPage}
          totalPages={products.meta.totalPages}
          onPageChange={setProductPage}
        />
      </Stack>
    </Container>
  );
}
