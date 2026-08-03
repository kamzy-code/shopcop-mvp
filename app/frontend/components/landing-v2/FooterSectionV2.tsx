'use client';
import { Box, Flex, Image, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

const footerLinks = {
  navigate: [
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'Process', href: '#process' },
    { label: 'Testimonials', href: '#testimonials' },
  ],
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/shopcopNg/', icon: FaFacebook },
    { label: 'Instagram', href: 'https://www.instagram.com/shopcop_ng/', icon: FaInstagram },
    { label: 'TikTok', href: 'https://www.tiktok.com/@shopcop_ng', icon: FaTiktok },
    { label: 'Twitter / X', href: 'https://x.com/ShopCop_ng', icon: FaXTwitter },
    { label: 'WhatsApp Business', href: 'https://wa.me/message/SO46QS26QZVVH1', icon: FaWhatsapp },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export function FooterSectionV2() {
  return (
    <Box as="footer" bg="gray.900" py={12} px={4}>
      <Flex direction={{ base: 'column', md: 'row' }} maxW="6xl" mx="auto" gap={{ base: 10, md: 12 }} justify="space-between">
        <Box maxW="280px">
          <Image src="/Logo SVGs/light.svg" alt="ShopCop" h={8} w="auto" mb={3} />
          <Text textStyle="xs" color="navy.300" lineHeight="1.6">
            Trust. Safety. Identity.
          </Text>
        </Box>

        <Flex gap={{ base: 8, md: 14 }} wrap="wrap">
          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="white" mb={3} textTransform="uppercase" letterSpacing="wider">
              Navigate
            </Text>
            <Stack gap={2}>
              {footerLinks.navigate.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <Text textStyle="xs" color="navy.300" _hover={{ color: 'white' }} transition="color 0.15s">
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Box>

          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="white" mb={3} textTransform="uppercase" letterSpacing="wider">
              Social
            </Text>
            <Stack gap={2}>
              {footerLinks.social.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Flex align="center" gap={2}>
                    <link.icon size={12} color="var(--chakra-colors-navy-300)" />
                    <Text textStyle="xs" color="navy.300" _hover={{ color: 'white' }} transition="color 0.15s">
                      {link.label}
                    </Text>
                  </Flex>
                </Link>
              ))}
            </Stack>
          </Box>

          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="white" mb={3} textTransform="uppercase" letterSpacing="wider">
              Legal
            </Text>
            <Stack gap={2}>
              {footerLinks.legal.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <Text textStyle="xs" color="navy.300" _hover={{ color: 'white' }} transition="color 0.15s">
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Box>
        </Flex>
      </Flex>

      <Box borderTopWidth="1px" borderColor="whiteAlpha.200" maxW="6xl" mx="auto" mt={8} pt={6}>
        <Text textStyle="2xs" color="navy.400" textAlign="center">
          &copy; {new Date().getFullYear()} ShopCop. All rights reserved.
        </Text>
      </Box>
    </Box>
  );
}
