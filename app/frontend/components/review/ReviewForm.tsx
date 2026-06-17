'use client';
import { useState } from 'react';
import { Box, Button, Field, Flex, Grid, Input, Spinner, Stack, Text, Textarea } from '@chakra-ui/react';
import { LuImage, LuX } from 'react-icons/lu';
import { toaster } from '@/components/ui/toaster';
import { useCreateReview } from '@/app/_hooks/reviews';
import { useUploadPublicMedia, useDeleteMedia, type UploadResult } from '@/app/_hooks/upload';
import { ReviewStars } from './ReviewStars';

interface ReviewFormProps {
  trackingToken: string;
  onSuccess?: () => void;
}

const MAX_MEDIA = 3;

export function ReviewForm({ trackingToken, onSuccess }: ReviewFormProps) {
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [responseRating, setResponseRating] = useState(0);
  const [satisfactionRating, setSatisfactionRating] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mediaSlots, setMediaSlots] = useState<(UploadResult | null)[]>([]);
  const [uploadingSlots, setUploadingSlots] = useState<boolean[]>([]);
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});
  const uploadMedia = useUploadPublicMedia();
  const deleteMedia = useDeleteMedia();

  const { mutate: createReview, isPending } = useCreateReview();

  const anyUploading = uploadingSlots.some(Boolean);

  const handleFileSelect = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toaster.create({ title: 'File must be under 10MB', type: 'error' });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setLocalPreviews((prev) => ({ ...prev, [index]: localUrl }));
    setUploadingSlots((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    try {
      const result = await uploadMedia.mutateAsync({ file, setUploadProgress: () => {} });
      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
      setMediaSlots((prev) => {
        const next = [...prev];
        next[index] = result;
        return next;
      });
    } catch {
      URL.revokeObjectURL(localUrl);
      setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
      toaster.create({ title: 'Failed to upload media', type: 'error' });
    }
    setUploadingSlots((prev) => {
      const next = [...prev];
      next[index] = false;
      return next;
    });
  };

  const handleSlotClick = (index: number) => {
    if (uploadingSlots[index] || mediaSlots[index]) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      handleFileSelect(index, f);
    };
    input.click();
  };

  const handleRemoveSlot = (index: number) => {
    const file = mediaSlots[index];
    if (file?.publicId) {
      deleteMedia.mutate(file.publicId);
    }
    if (localPreviews[index]) {
      URL.revokeObjectURL(localPreviews[index]);
      setLocalPreviews((prev) => { const next = { ...prev }; delete next[index]; return next; });
    }
    setMediaSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleSubmit = () => {
    if (anyUploading) {
      toaster.create({ title: 'Please wait for uploads to complete', type: 'warning' });
      return;
    }

    const provided = [deliveryRating, responseRating, satisfactionRating].filter((r) => r > 0);
    if (provided.length === 0) {
      toaster.create({ title: 'Please rate at least one category', type: 'error' });
      return;
    }
    const overallRating = Math.round(provided.reduce((a, b) => a + b, 0) / provided.length);

    const media = mediaSlots
      .filter((m): m is UploadResult => m !== null)
      .map((m, i) => ({
        media_url: m.url,
        public_id: m.publicId,
        media_type: (m.resourceType === 'video' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
        position: i,
      }));

    createReview(
      {
        tracking_token: trackingToken,
        overall_rating: overallRating,
        delivery_rating: deliveryRating > 0 ? deliveryRating : undefined,
        response_rating: responseRating > 0 ? responseRating : undefined,
        satisfaction_rating: satisfactionRating > 0 ? satisfactionRating : undefined,
        buyer_name: buyerName.trim() || undefined,
        review_text: reviewText.trim() || undefined,
        media: media.length > 0 ? media : undefined,
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

        <Field.Root>
          <Field.Label>
            Media{' '}
            <Text as="span" color="fg.muted" textStyle="xs">(optional, up to 3)</Text>
          </Field.Label>
          <Grid templateColumns="repeat(3, 1fr)" gap={2}>
            {Array.from({ length: MAX_MEDIA }).map((_, i) => {
              const slot = mediaSlots[i] ?? null;
              const isUploading = uploadingSlots[i] ?? false;
              const localUrl = localPreviews[i];
              const previewUrl = localUrl || slot?.url || null;
              const isVideo = localUrl
                ? fileTypeIsVideo(localUrl)
                : slot?.resourceType === 'video';
              return (
                <Box
                  key={i}
                  aspectRatio={1}
                  borderRadius="lg"
                  borderWidth="2px"
                  borderStyle={previewUrl ? 'solid' : 'dashed'}
                  borderColor={previewUrl ? 'primary.300' : 'border'}
                  bg={previewUrl ? 'transparent' : 'bg.subtle'}
                  position="relative"
                  overflow="hidden"
                  cursor={isUploading || previewUrl ? 'default' : 'pointer'}
                  onClick={() => handleSlotClick(i)}
                  _hover={isUploading || previewUrl ? {} : { borderColor: 'primary.400', bg: 'primary.subtle' }}
                  transition="all 0.15s"
                >
                  {previewUrl ? (
                    <>
                      {isVideo ? (
                        <video
                          src={previewUrl}
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt={`Review media ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      <Box
                        as="button"
                        position="absolute"
                        top={1}
                        right={1}
                        w={5}
                        h={5}
                        borderRadius="full"
                        bg="red.500"
                        color="white"
                        fontSize="xs"
                        lineHeight="1"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        onClick={(e) => { e.stopPropagation(); handleRemoveSlot(i); }}
                        aria-label="Remove media"
                      >
                        <LuX size={10} />
                      </Box>
                    </>
                  ) : (
                    <Flex direction="column" align="center" justify="center" h="full" gap={1} p={2}>
                      <LuImage size={18} />
                      <Text textStyle="2xs" color="fg.muted" textAlign="center">
                        Media
                      </Text>
                    </Flex>
                  )}
                  {isUploading && (
                    <Box
                      position="absolute"
                      inset={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="blackAlpha.400"
                      borderRadius="lg"
                      zIndex={1}
                    >
                      <Spinner size="md" color="white" />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Grid>
        </Field.Root>

        <Flex gap={2} justify="flex-end">
          <Button
            colorPalette="primary"
            onClick={handleSubmit}
            loading={isPending}
            disabled={(deliveryRating === 0 && responseRating === 0 && satisfactionRating === 0) || anyUploading}
          >
            Submit Review
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}

function fileTypeIsVideo(src: string): boolean {
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.quicktime'];
  try {
    const ext = new URL(src).pathname.toLowerCase();
    return videoExts.some((e) => ext.endsWith(e));
  } catch {
    return false;
  }
}
