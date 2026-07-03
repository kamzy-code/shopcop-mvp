'use client';
import { Box, Button, Flex, IconButton, Image, Stack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { LuMenu, LuX } from 'react-icons/lu';

interface LandingNavbarV2Props {
  ctaLabel: string;
  ctaHref: string;
}

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Process', href: '#process' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQs', href: '#faq' },
];

const m = motion;

export function LandingNavbarV2({ ctaLabel, ctaHref }: LandingNavbarV2Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box
      position="fixed"
      w={'full'}
      top={{ base: 3, md: 5 }}
      zIndex={50}
      px={{ base: 3, md: 8, lg: 4 }}
    >
      <Flex
        as="header"
        align="center"
        justify="space-between"
        maxW="6xl"
        mx="auto"
        bg="white"
        borderRadius="full"
        boxShadow={{ base: 'lg', _dark: 'none' }}
        px={{ base: 4, md: 6 }}
        py={2.5}
      >
        <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Flex align="center" gap={2}>
              <Image src="/Logo SVGs/gradient.svg" alt="ShopCop" h={7} w="auto" />
            </Flex>
          </Link>
        </m.div>

        {/* Desktop nav */}
        <Flex align="center" gap={7} display={{ base: 'none', md: 'flex' }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <Text
                textStyle="sm"
                color="navy.600"
                fontWeight="medium"
                _hover={{ color: 'primary.600' }}
                transition="color 0.15s"
              >
                {link.label}
              </Text>
            </Link>
          ))}
        </Flex>

        <Flex align="center" gap={3} display={{ base: 'none', md: 'flex' }}>
          {
            <Link href="/auth/login" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" color="navy.600">
                Sign In
              </Button>
            </Link>
          }
          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button size="sm" colorPalette="primary" borderRadius="full">
                {ctaLabel}
              </Button>
            </Link>
          </m.div>
        </Flex>

        {/* Mobile hamburger */}
        <Box display={{ base: 'block', md: 'none' }}>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            color="navy.600"
          >
            {mobileOpen ? <LuX /> : <LuMenu />}
          </IconButton>
        </Box>
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
            bg="white"
            zIndex={1}
            p={6}
          >
            <Flex justify="flex-end" mb={1}>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                color="navy.600"
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
                  <Text textStyle="md" color="navy.800" fontWeight="medium">
                    {link.label}
                  </Text>
                </Link>
              ))}
              <Box pt={4} borderTopWidth="1px" borderColor="border">
                {
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="ghost" size="sm" w="full" mb={2}>
                      Sign In
                    </Button>
                  </Link>
                }
                <Link
                  href={ctaHref}
                  onClick={() => setMobileOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="sm" colorPalette="primary" w="full" borderRadius="full">
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
