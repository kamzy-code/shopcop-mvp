'use client';
import { Box, Button, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { LuBadgeCheck, LuPlay, LuSparkle } from 'react-icons/lu';
import { GradientBlob } from './GradientBlob';
import { Reveal } from './Reveal';
import { VideoModal } from './VideoModal';

interface HeroSectionProps {
  ctaLabel: string;
  ctaHref: string;
}

const m = motion;

export function HeroSection({ ctaLabel, ctaHref }: HeroSectionProps) {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <Box as="section" py={{ base: 16, md: 24 }} px={4} id="hero" position="relative" overflow="hidden">
      <GradientBlob color="var(--chakra-colors-primary-500)" size="500px" top="-160px" left="-120px" opacity={0.16} />
      <GradientBlob color="var(--chakra-colors-accent-500)" size="420px" top="60px" right="-160px" opacity={0.14} />

      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        maxW="6xl"
        mx="auto"
        gap={{ base: 10, md: 16 }}
        position="relative"
        zIndex={1}
      >
        {/* Left: Text Content */}
        <Box flex={1} textAlign={{ base: 'center', md: 'left' }}>
          <Reveal delay={0}>
            <Flex
              align="center"
              gap={2}
              display={{ base: 'inline-flex', md: 'inline-flex' }}
              bg="primary.subtle"
              px={3}
              py={1.5}
              borderRadius="full"
              mb={5}
            >
              <Icon as={LuSparkle} boxSize={3.5} color="primary.500" />
              <Text textStyle="2xs" fontWeight="bold" color="primary.fg" letterSpacing="wider" textTransform="uppercase">
                Verified Commerce
              </Text>
            </Flex>
          </Reveal>

          <Reveal delay={0.1}>
            <Heading
              as="h1"
              textStyle={{ base: '4xl', md: '6xl' }}
              fontWeight="black"
              letterSpacing="tighter"
              color="fg"
              lineHeight="1.05"
              mb={4}
            >
              Sell More by Proving{' '}
              <Box as="span" color="primary.500" position="relative" display="inline-block">
                You&apos;re Legit
              </Box>
            </Heading>
          </Reveal>

          <Reveal delay={0.2}>
            <Text textStyle={{ base: 'md', md: 'lg' }} color="fg.muted" mb={8} lineHeight="1.6">
              Get verified on ShopCop, build trust with buyers, and close deals faster.
              No haggling. No suspicion. Just sales.
            </Text>
          </Reveal>

          <Reveal delay={0.3}>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={4}
              mb={8}
              justify={{ base: 'center', md: 'flex-start' }}
            >
              <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link href={ctaHref} style={{ textDecoration: 'none' }}>
                  <Button size="lg" colorPalette="primary" px={10} py={6} textStyle="md" fontWeight="semibold" w={{ base: 'full', sm: 'auto' }}>
                    {ctaLabel}
                  </Button>
                </Link>
              </m.div>
              <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  px={8}
                  py={6}
                  textStyle="md"
                  fontWeight="semibold"
                  onClick={() => setVideoOpen(true)}
                  w={{ base: 'full', sm: 'auto' }}
                >
                  <LuPlay size={18} />
                  Watch 2-Min Demo
                </Button>
              </m.div>
            </Flex>
          </Reveal>

          <Reveal delay={0.4}>
            <Flex
              direction="column"
              gap={2}
              color="fg.muted"
              align={{ base: 'center', md: 'flex-start' }}
            >
              <Flex align="center" gap={2}>
                <LuBadgeCheck size={16} color="var(--chakra-colors-primary-500)" />
                <Text textStyle="sm">50+ sellers already testing</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <LuBadgeCheck size={16} color="var(--chakra-colors-primary-500)" />
                <Text textStyle="sm">Free during beta</Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Box w={2} h={2} borderRadius="full" bg="orange.400" />
                <Text textStyle="sm" fontWeight="semibold" color="orange.400">
                  Only 15 spots left
                </Text>
              </Flex>
            </Flex>
          </Reveal>
        </Box>

        {/* Right: Visual */}
        <Box flex={1} display={{ base: 'none', md: 'block' }} position="relative" w="full" maxW="480px">
          <Reveal delay={0.35} y={20}>
            <m.div
              initial={{ rotate: 3 }}
              animate={{ rotate: [3, 1, 3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'relative' }}
            >
              <Box
                w="full"
                aspectRatio={4 / 5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border"
                bg="bg.subtle"
                overflow="hidden"
                position="relative"
                boxShadow="2xl"
              >
                <DashboardPreview />
              </Box>
            </m.div>
          </Reveal>

          {/* Floating verification badge chip */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ delay: 0.8, duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', bottom: '-24px', left: '-32px' }}
          >
            <Flex
              align="center"
              gap={3}
              bg="bg.panel"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              px={4}
              py={3}
              boxShadow="xl"
            >
              <Flex w={9} h={9} borderRadius="full" bg="success.subtle" align="center" justify="center" flexShrink={0}>
                <LuBadgeCheck size={18} color="var(--chakra-colors-success-500)" />
              </Flex>
              <Box>
                <Text textStyle="xs" fontWeight="bold" color="fg">
                  Verified Seller
                </Text>
                <Text textStyle="2xs" color="fg.subtle">
                  ID checked &middot; 24h
                </Text>
              </Box>
            </Flex>
          </m.div>
        </Box>
      </Flex>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </Box>
  );
}

function DashboardPreview() {
  return (
    <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Device frame */}
      <rect x="0" y="0" width="400" height="500" rx="12" fill="var(--chakra-colors-bg-emphasized, #2d3748)" />
      <rect x="8" y="8" width="384" height="484" rx="8" fill="var(--chakra-colors-bg-panel, #1a202c)" />

      {/* Top bar */}
      <rect x="140" y="0" width="120" height="20" rx="10" fill="var(--chakra-colors-bg-emphasized, #2d3748)" />

      {/* Header area */}
      <rect x="24" y="36" width="160" height="24" rx="4" fill="var(--chakra-colors-primary-500, #319795)" opacity="0.8" />
      <rect x="200" y="42" width="80" height="12" rx="3" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.3" />

      {/* Card: Verification badge */}
      <rect x="24" y="76" width="352" height="80" rx="8" fill="var(--chakra-colors-bg, #2d3748)" />
      <circle cx="56" cy="116" r="20" fill="var(--chakra-colors-primary-subtle, #234e52)" />
      <rect x="88" y="106" width="120" height="8" rx="2" fill="var(--chakra-colors-fg, #e2e8f0)" opacity="0.6" />
      <rect x="88" y="120" width="80" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.3" />

      {/* Stats grid */}
      {[0, 1].map((row) =>
        [0, 1].map((col) => (
          <rect key={`${row}-${col}`} x={24 + col * 180} y={176 + row * 120} width="160" height="100" rx="8" fill="var(--chakra-colors-bg, #2d3748)" />
        ))
      )}
      {[0, 1].map((row) =>
        [0, 1].map((col) => (
          <rect key={`t${row}-${col}`} x={44 + col * 180} y={196 + row * 120} width="60" height="8" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.3" />
        ))
      )}
      {[0, 1].map((row) =>
        [0, 1].map((col) => (
          <rect key={`v${row}-${col}`} x={44 + col * 180} y={212 + row * 120} width="40" height="24" rx="4" fill="var(--chakra-colors-primary-500, #319795)" opacity="0.5" />
        ))
      )}

      {/* Bottom table */}
      <rect x="24" y="416" width="352" height="60" rx="8" fill="var(--chakra-colors-bg, #2d3748)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={44 + i * 100} y={432} width="80" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.2" />
      ))}
      {[0, 1].map((i) => (
        <rect key={`r${i}`} x={44} y={450 + i * 12} width={300 - i * 60} height="4" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.08" />
      ))}
    </svg>
  );
}
