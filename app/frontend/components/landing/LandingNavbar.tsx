'use client';
import { Box, Button, Flex, IconButton, Stack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { LuBadgeCheck, LuMenu, LuX } from 'react-icons/lu';
import { ColorModeButton } from '@/components/ui/color-mode';

interface LandingNavbarProps {
  isLoggedIn: boolean;
  ctaLabel: string;
  ctaHref: string;
}

const navLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Vendors', href: '#benefits' },
  { label: 'For Buyers', href: '#proof' },
  { label: 'FAQ', href: '#faq' },
];

const m = motion;

export function LandingNavbar({ isLoggedIn, ctaLabel, ctaHref }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
      boxShadow="sm"
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
                borderRadius="full"
                bg="primary.500"
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="sm"
              >
                <LuBadgeCheck size={18} color="white" />
              </Flex>
              <Text fontWeight="bold" textStyle="lg" color="fg">
                ShopCop
              </Text>
            </Flex>
          </Link>
        </m.div>

        {/* Desktop nav */}
        <Flex align="center" gap={6} display={{ base: 'none', md: 'flex' }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <Text textStyle="sm" color="fg.muted" _hover={{ color: 'fg' }} transition="color 0.15s">
                {link.label}
              </Text>
            </Link>
          ))}
        </Flex>

        <Flex align="center" gap={3} display={{ base: 'none', md: 'flex' }}>
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

        {/* Mobile hamburger */}
        <Flex align="center" gap={2} display={{ base: 'flex', md: 'none' }}>
          <ColorModeButton />
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            color="fg.muted"
          >
            {mobileOpen ? <LuX /> : <LuMenu />}
          </IconButton>
        </Flex>
      </Flex>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={100}
          display={{ md: 'none' }}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0,0,0,0.5)"
            onClick={() => setMobileOpen(false)}
          />
          <Box
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            w="260px"
            bg="bg.panel"
            borderLeftWidth="1px"
            borderColor="border"
            zIndex={1}
            p={6}
          >
            <Flex justify="flex-end" mb={6}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                color="fg.muted"
              >
                <LuX />
              </IconButton>
            </Flex>
            <Stack gap={4}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Text textStyle="md" color="fg" fontWeight="medium">
                    {link.label}
                  </Text>
                </Link>
              ))}
              <Box pt={4} borderTopWidth="1px" borderColor="border">
                {!isLoggedIn && (
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                    <Button variant="ghost" size="sm" w="full" mb={2}>
                      Sign In
                    </Button>
                  </Link>
                )}
                <Link href={ctaHref} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <Button size="sm" colorPalette="primary" w="full">
                    {ctaLabel}
                  </Button>
                </Link>
              </Box>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
