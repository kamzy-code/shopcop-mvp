'use client';
import { Box, Flex, Heading, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { LuArrowRight, LuBadgeCheck, LuSparkle } from 'react-icons/lu';
import { GradientBlob } from '@/components/landing/GradientBlob';
import { Reveal } from '@/components/landing/Reveal';

interface HeroSectionV2Props {
  ctaLabel: string;
  ctaHref: string;
}

const m = motion;

export function HeroSectionV2({ ctaLabel, ctaHref }: HeroSectionV2Props) {
  return (
    <Flex
      flexDir={'column'}
      justify={'center'}
      align={'start'}
      as="section"
      id="about"
      position="relative"
      overflow="hidden"
      bg="primary.900"
      pt={{ base: 20, md: 28 }}
      pb={{ base: 20, md: 28 }}
      px={{ base: 8, md: 24 }}
      minH={'vh'}
    >
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

      <GradientBlob color="var(--chakra-colors-primary-300)" size="680px" top="-60px" right="240px" opacity={0.35} />

      <Flex
        maxW="6xl"
        mx="auto"
        w="full"
        position="relative"
        zIndex={1}
        direction={{ base: 'column', md: 'row' }}
        align="center"
        gap={{ base: 10, md: 16 }}
      >
      <Box flex={1}>
        <Reveal delay={0}>
          <Flex
            align="center"
            gap={2}
            display="inline-flex"
            bg="white/10"
            borderWidth="1px"
            borderColor="white/20"
            px={3}
            py={1.5}
            borderRadius="full"
            mb={6}
          >
            <Icon as={LuSparkle} boxSize={3.5} color="primary.300" />
            <Text
              textStyle="2xs"
              fontWeight="bold"
              color="primary.300"
              letterSpacing="wider"
              textTransform="uppercase"
            >
              Now accepting founding vendors
            </Text>
          </Flex>
        </Reveal>

        <Reveal delay={0.1}>
          <Heading
            as="h1"
            textStyle={{ base: '4xl', md: '6xl' }}
            fontWeight="black"
            letterSpacing="tighter"
            color="white"
            lineHeight="1.05"
            maxW="3xl"
            mb={5}
          >
            Verified once. Trusted everywhere you sell.
          </Heading>
        </Reveal>

        <Reveal delay={0.2}>
          <Text
            textStyle={{ base: 'md', md: 'lg' }}
            color="navy.200"
            maxW="2xl"
            mb={9}
            lineHeight="1.6"
          >
            ShopCop gives vendors a verified profile that proves you&apos;re legitimate — on
            Instagram, WhatsApp, and TikTok so buyers stop hesitating, and you stop re-explaining
            yourself to every new customer.
          </Text>
        </Reveal>

        <Reveal delay={0.3}>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
            align={{ base: 'stretch', sm: 'center' }}
          >
            <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link href={ctaHref} style={{ textDecoration: 'none' }}>
                <Flex
                  as="span"
                  align="center"
                  justify="center"
                  gap={2}
                  bg="primary.500"
                  color="white"
                  px={8}
                  py={3.5}
                  borderRadius="full"
                  fontWeight="semibold"
                  textStyle="md"
                  boxShadow={{base: "lg", _dark: "none"}}
                  _hover={{ bg: 'primary.600' }}
                  transition="background 0.15s"
                >
                  {ctaLabel}
                </Flex>
              </Link>
            </m.div>
            <Link href="#process" style={{ textDecoration: 'none' }}>
              <Flex
                align="center"
                justify="center"
                gap={2}
                color="white"
                fontWeight="semibold"
                textStyle="md"
                px={4}
                py={3.5}
              >
                See how it works
                <Icon as={LuArrowRight} boxSize={4} />
              </Flex>
            </Link>
          </Flex>
        </Reveal>
      </Box>

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
              bg="transparent"
              overflow="hidden"
              position="relative"

            >
              <Image
                src="/screen mockups/public_profile.png"
                alt="ShopCop public vendor profile preview"
                fill
                sizes="(max-width: 768px) 0px, 480px"
                style={{ objectFit: 'contain' }}
              />
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
          <Flex align="center" gap={3} bg="white" borderRadius="xl" px={4} py={3} boxShadow="xl">
            <Flex w={9} h={9} borderRadius="full" bg="success.subtle" align="center" justify="center" flexShrink={0}>
              <LuBadgeCheck size={18} color="var(--chakra-colors-success-500)" />
            </Flex>
            <Box>
              <Text textStyle="xs" fontWeight="bold" color="navy.900">
                Verified Seller
              </Text>
              <Text textStyle="2xs" color="navy.500">
                ID checked &middot; 24h
              </Text>
            </Box>
          </Flex>
        </m.div>
      </Box>
      </Flex>
    </Flex>
  );
}
