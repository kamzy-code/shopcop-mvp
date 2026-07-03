'use client';
import { Box, Stack, Text } from '@chakra-ui/react';
import { Reveal } from '@/components/landing/Reveal';
import { SectionEyebrow } from '@/components/landing/SectionEyebrow';
import { StackedFeatureCards } from './StackedFeatureCards';

// Placeholder stock photo — replace with a real product screenshot / vendor photo before launch.
const PLACEHOLDER_FEATURE_IMAGE_URL =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80';

const features = [
  {
    number: '1',
    title: 'A profile that does the convincing for you',
    description:
      'Earn absolute customer trust instantly with unforgeable green verification badges and real buyer reviews.',
    imageUrl: PLACEHOLDER_FEATURE_IMAGE_URL,
    imageAlt: 'Hands holding a credit card next to a laptop, representing secure online checkout',
    imageSide: 'right' as const,
  },
  {
    number: '2',
    title: 'Build Your Reputation',
    description:
      'One shareable link that works across all your social platforms — Instagram, WhatsApp, and TikTok.',
    imageUrl: PLACEHOLDER_FEATURE_IMAGE_URL,
    imageAlt: 'A smartphone displaying a social media post with a link to a product page',
    imageSide: 'left' as const,
  },
  {
    number: '3',
    title: 'Make Sales Faster',
    description:
      'Give first-time profile visitors the ultimate confidence to order and pay the exact second they find your store.',
    imageUrl: PLACEHOLDER_FEATURE_IMAGE_URL,
    imageAlt:
      'A happy customer receiving a package at their doorstep, representing a successful purchase',
    imageSide: 'right' as const,
  },
  {
    number: '4',
    title: 'Real-Time Order Tracking',
    description:
      'Give your customers complete peace of mind by letting them track their delivery progress from payment straight to their doorstep.',
    imageUrl: PLACEHOLDER_FEATURE_IMAGE_URL,
    imageAlt: 'A delivery truck on a road, representing package tracking and delivery',
    imageSide: 'left' as const,
  },
];

export function FeaturesSection() {
  return (
    <Box as="section" id="features" py={{ base: 14, md: 20 }} px={4} bg="bg">
      <Stack gap={{ base: 10, md: 14 }} maxW="6xl" mx="auto">
        <Reveal>
          <Box textAlign="center" maxW="2xl" mx="auto">
            <SectionEyebrow label="Our Features" colorPalette="primary" />
            <Text
              fontWeight="extrabold"
              textStyle={{ base: '2xl', md: '3xl' }}
              style={{
                background: 'linear-gradient(to right, #5eead4, #0f766e)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              mb={3}
              letterSpacing="tight"
            >
              Everything you need to turn buyer hesitation into instant sales
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Simple, powerful tools built for social media sellers to prove they are real, show off
              their good work, and keep customers completely happy.
            </Text>
          </Box>
        </Reveal>

        <StackedFeatureCards features={features} />
      </Stack>
    </Box>
  );
}
