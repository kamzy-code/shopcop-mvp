'use client';
import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Reveal } from '@/components/landing/Reveal';

interface FinalCtaSectionProps {
  ctaLabel: string;
  ctaHref: string;
}

const m = motion;

export function FinalCtaSection({ ctaLabel, ctaHref }: FinalCtaSectionProps) {
  return (
    <Box as="section" position="relative" overflow="hidden" bg="primary.900" py={{ base: 16, md: 20 }} px={4}>
      <Box
        position="absolute"
        inset={0}
        opacity={1}
        zIndex={0}
        style={{
          backgroundImage: 'url(/pattern_overlay.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Reveal y={30}>
        <Box maxW="2xl" mx="auto" textAlign="center" position="relative" zIndex={1}>
          <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '4xl' }} color="white" mb={8} letterSpacing="tight" lineHeight="1.2">
            Stop re-proving you&apos;re real. Prove it once.
          </Text>

          <m.div style={{ display: 'inline-block' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Box
                as="span"
                display="inline-block"
                bg="primary.500"
                color="white"
                px={10}
                py={4}
                borderRadius="full"
                fontWeight="semibold"
                textStyle="md"
                boxShadow={{base:"lg", _dark:"none"}}
                _hover={{ bg: 'primary.600' }}
                transition="background 0.15s"
              >
                {ctaLabel}
              </Box>
            </Link>
          </m.div>

          <Text textStyle="xs" color="navy.200" mt={4}>
            Takes less than 24 hours. Free during beta, no card required.
          </Text>
        </Box>
      </Reveal>
    </Box>
  );
}
