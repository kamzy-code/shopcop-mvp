'use client';
import { Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import Link from 'next/link';
import { LuBadgeCheck, LuMail, LuMessageCircle } from 'react-icons/lu';

const footerLinks = {
  company: [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ],
  product: [
    { label: 'For Vendors', href: '#benefits' },
    { label: 'For Buyers', href: '#proof' },
  ],
  legal: [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
  ],
};

export function FooterSection() {
  return (
    <Box as="footer" py={10} px={4} borderTopWidth="1px" borderColor="border" bg="bg.panel">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        maxW="6xl"
        mx="auto"
        gap={{ base: 8, md: 12 }}
        justify="space-between"
      >
        {/* Brand */}
        <Box maxW="240px">
          <Flex align="center" gap={2} mb={3}>
            <Flex
              w={7}
              h={7}
              borderRadius="md"
              bg="primary.500"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuBadgeCheck size={16} color="white" />
            </Flex>
            <Text fontWeight="bold" textStyle="sm" color="fg">
              ShopCop
            </Text>
          </Flex>
          <Text textStyle="xs" color="fg.subtle" lineHeight="1.5">
            Verified commerce platform for Nigerian sellers. Get verified, build trust, close deals faster.
          </Text>
        </Box>

        {/* Link columns */}
        <Flex gap={{ base: 8, md: 12 }} wrap="wrap">
          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="fg" mb={3} textTransform="uppercase" letterSpacing="wider">
              Company
            </Text>
            <Stack gap={2}>
              {footerLinks.company.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <Text textStyle="xs" color="fg.subtle" _hover={{ color: 'fg' }} transition="color 0.15s">
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Box>
          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="fg" mb={3} textTransform="uppercase" letterSpacing="wider">
              Product
            </Text>
            <Stack gap={2}>
              {footerLinks.product.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <Text textStyle="xs" color="fg.subtle" _hover={{ color: 'fg' }} transition="color 0.15s">
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Box>
          <Box>
            <Text fontWeight="semibold" textStyle="xs" color="fg" mb={3} textTransform="uppercase" letterSpacing="wider">
              Legal
            </Text>
            <Stack gap={2}>
              {footerLinks.legal.map((link) => (
                <Link key={link.label} href={link.href} style={{ textDecoration: 'none' }}>
                  <Text textStyle="xs" color="fg.subtle" _hover={{ color: 'fg' }} transition="color 0.15s">
                    {link.label}
                  </Text>
                </Link>
              ))}
            </Stack>
          </Box>
        </Flex>

        {/* Contact */}
        <Box>
          <Text fontWeight="semibold" textStyle="xs" color="fg" mb={3} textTransform="uppercase" letterSpacing="wider">
            Contact
          </Text>
          <Stack gap={2}>
            <Flex align="center" gap={2}>
              <Icon as={LuMail} boxSize={3.5} color="fg.subtle" />
              <Text textStyle="xs" color="fg.subtle">
                hello@getshopcop.com
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={LuMessageCircle} boxSize={3.5} color="fg.subtle" />
              <Text textStyle="xs" color="fg.subtle">
                WhatsApp: Coming soon
              </Text>
            </Flex>
          </Stack>
        </Box>
      </Flex>

      <Box borderTopWidth="1px" borderColor="border" mt={8} pt={6}>
        <Flex direction="column" align="center" textAlign="center" gap={1}>
          <Text textStyle="2xs" color="fg.subtle">
            &copy; {new Date().getFullYear()} ShopCop. Built in Nigeria. 🇳🇬
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
