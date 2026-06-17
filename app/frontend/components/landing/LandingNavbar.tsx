'use client';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LuBadgeCheck } from 'react-icons/lu';
import { ColorModeButton } from '@/components/ui/color-mode';

interface LandingNavbarProps {
  isLoggedIn: boolean;
  ctaLabel: string;
  ctaHref: string;
}

const m = motion;

export function LandingNavbar({ isLoggedIn, ctaLabel, ctaHref }: LandingNavbarProps) {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      bg="bg.panel/80"
      backdropFilter="auto"
      backdropBlur="8px"
      borderBottomWidth="1px"
      borderColor="border"
      px={4}
      py={3}
    >
      <Flex align="center" justify="space-between" maxW="6xl" mx="auto">
        <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Flex align="center" gap={2}>
              <Flex
                w={8}
                h={8}
                borderRadius="lg"
                bg="primary.500"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <LuBadgeCheck size={18} color="white" />
              </Flex>
              <Text fontWeight="bold" textStyle="lg" color="fg">
                ShopCop
              </Text>
            </Flex>
          </Link>
        </m.div>

        <Flex align="center" gap={3}>
          {!isLoggedIn && (
            <Link href="/auth/login" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" color="fg.muted">
                Sign In
              </Button>
            </Link>
          )}
          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button size="sm" colorPalette="primary">
                {ctaLabel}
              </Button>
            </Link>
          </m.div>
          <ColorModeButton />
        </Flex>
      </Flex>
    </Box>
  );
}
