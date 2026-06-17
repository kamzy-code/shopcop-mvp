'use client';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LuBadgeCheck } from 'react-icons/lu';
import { Reveal } from './Reveal';

interface CtaSectionProps {
  ctaLabel: string;
  ctaHref: string;
}

export function CtaSection({ ctaLabel, ctaHref }: CtaSectionProps) {
  return (
    <Box as="section" py={{ base: 16, md: 20 }} px={4}>
      <Reveal y={30}>
        <Flex
          direction="column"
          align="center"
          textAlign="center"
          maxW="3xl"
          mx="auto"
          gap={6}
          bg="primary.subtle"
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-50%"
            right="-20%"
            w="300px"
            h="300px"
            borderRadius="full"
            bg="primary.500"
            opacity={0.06}
          />
          <Box
            position="absolute"
            bottom="-30%"
            left="-10%"
            w="200px"
            h="200px"
            borderRadius="full"
            bg="primary.500"
            opacity={0.04}
          />

          <Heading as="h2" textStyle="2xl" fontWeight="bold" color="primary.fg" position="relative">
            Ready to get verified?
          </Heading>

          <Text textStyle="md" color="primary.fg" position="relative">
            Join Nigeria&apos;s fastest-growing verification platform for social commerce sellers.
          </Text>

          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ position: 'relative' }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button size="lg" colorPalette="primary" px={8}>
                {ctaLabel}
              </Button>
            </Link>
          </m.div>

          <Flex align="center" gap={2} position="relative">
            <LuBadgeCheck size={16} />
            <Text textStyle="sm" color="primary.fg">
              50 sellers already on ShopCop
            </Text>
          </Flex>
        </Flex>
      </Reveal>
    </Box>
  );
}

const m = motion;
