'use client';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LuBadgeCheck } from 'react-icons/lu';
import { Reveal } from './Reveal';

interface HeroSectionProps {
  ctaLabel: string;
  ctaHref: string;
}

export function HeroSection({ ctaLabel, ctaHref }: HeroSectionProps) {
  return (
    <Box as="section" py={{ base: 16, md: 24 }} px={4}>
      <Flex direction="column" align="center" textAlign="center" maxW="3xl" mx="auto" gap={6}>
        <Reveal delay={0.1}>
          <Heading as="h1" textStyle={{ base: '3xl', md: '5xl' }} fontWeight="extrabold" letterSpacing="tight" color="fg" lineHeight="1.1">
            Get Verified on{' '}
            <Box as="span" color="primary.500">
              ShopCop
            </Box>
          </Heading>
        </Reveal>

        <Reveal delay={0.2}>
          <Text textStyle={{ base: 'md', md: 'lg' }} color="fg.muted" maxW="2xl">
            Sell more on WhatsApp, Instagram & TikTok by proving you&apos;re a legit business.
            Build trust, get verified, and grow your sales.
          </Text>
        </Reveal>

        <Reveal delay={0.3}>
          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button size="lg" colorPalette="primary" px={10} py={6} textStyle="md" fontWeight="semibold">
                {ctaLabel}
              </Button>
            </Link>
          </m.div>
        </Reveal>

        <Reveal delay={0.4}>
          <Flex align="center" gap={2} color="fg.muted">
            <LuBadgeCheck size={16} color="var(--chakra-colors-primary-500)" />
            <Text textStyle="sm">50 sellers already joined</Text>
          </Flex>
        </Reveal>
      </Flex>
    </Box>
  );
}

const m = motion;
