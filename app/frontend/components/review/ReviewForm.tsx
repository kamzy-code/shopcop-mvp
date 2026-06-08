'use client';
import { useState } from 'react';
import { Box, Button, Field, Flex, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import { useCreateReview } from '@/app/_hooks/reviews';
import { ReviewStars } from './ReviewStars';

interface ReviewFormProps {
  trackingToken: string;
  onSuccess?: () => void;
}

export function ReviewForm({ trackingToken, onSuccess }: ReviewFormProps) {
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [responseRating, setResponseRating] = useState(0);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: createReview, isPending } = useCreateReview();

  const handleSubmit = () => {
    const provided = [deliveryRating, responseRating, satisfactionRating].filter((r) => r > 0);
    if (provided.length === 0) {
      toaster.create({ title: 'Please rate at least one category', type: 'error' });
      return;
    }
    const overallRating = Math.round(provided.reduce((a, b) => a + b, 0) / provided.length);

    createReview(
      {
        tracking_token: trackingToken,
        overall_rating: overallRating,
        delivery_rating: deliveryRating > 0 ? deliveryRating : undefined,
        response_rating: responseRating > 0 ? responseRating : undefined,
        satisfaction_rating: satisfactionRating > 0 ? satisfactionRating : undefined,
        buyer_name: buyerName.trim() || undefined,
        review_text: reviewText.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toaster.create({ title: 'Review submitted! Thank you.', type: 'success' });
          onSuccess?.();
        },
        onError: (err) => {
          toaster.create({ title: err.message || 'Failed to submit review', type: 'error' });
        },
      }
    );
  };

  if (submitted) {
    return (
      <Box p={4} bg="green.subtle" borderRadius="xl" textAlign="center">
        <Text fontWeight="semibold" color="green.700" _dark={{ color: 'green.300' }}>
          Thank you for your review!
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Text textStyle="sm" fontWeight="semibold" mb={4}>
        Share your experience
      </Text>

      <Stack gap={4}>
        <Text textStyle="xs" color="fg.muted">Rate at least one category below.</Text>

        <Field.Root>
          <Field.Label>How was the delivery?</Field.Label>
          <ReviewStars rating={deliveryRating} size="lg" interactive onChange={setDeliveryRating} />
        </Field.Root>

        <Field.Root>
          <Field.Label>How quickly did the vendor respond?</Field.Label>
          <ReviewStars rating={responseRating} size="lg" interactive onChange={setResponseRating} />
        </Field.Root>

        <Field.Root>
          <Field.Label>How satisfied are you with your order?</Field.Label>
          <ReviewStars rating={satisfactionRating} size="lg" interactive onChange={setSatisfactionRating} />
        </Field.Root>

        <Field.Root>
          <Field.Label>
            Your name{' '}
            <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text>
          </Field.Label>
          <Input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={100}
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>
            Tell us more{' '}
            <Text as="span" color="fg.muted" textStyle="xs">(optional)</Text>
          </Field.Label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What would you like others to know?"
            maxLength={2000}
            rows={3}
          />
        </Field.Root>

        <Flex gap={2} justify="flex-end">
          <Button
            colorPalette="primary"
            onClick={handleSubmit}
            loading={isPending}
            disabled={deliveryRating === 0 && responseRating === 0 && satisfactionRating === 0}
          >
            Submit Review
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
