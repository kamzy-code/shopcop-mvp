'use client';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LuBadgeCheck, LuClock, LuZap } from 'react-icons/lu';
import { Reveal } from './Reveal';

interface CtaSectionProps {
  ctaLabel: string;
  ctaHref: string;
}

const m = motion;

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
          bg="navy.900"
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="-50%"
            right="-20%"
            w="320px"
            h="320px"
            borderRadius="full"
            bg="primary.400"
            style={{ filter: 'blur(40px)' }}
            opacity={0.25}
          />
          <Box
            position="absolute"
            bottom="-30%"
            left="-10%"
            w="240px"
            h="240px"
            borderRadius="full"
            bg="accent.500"
            style={{ filter: 'blur(40px)' }}
            opacity={0.25}
          />

          <Heading as="h2" textStyle={{ base: '2xl', md: '3xl' }} fontWeight="extrabold" color="white" position="relative" letterSpacing="tight">
            Ready to Stop Losing Sales?
          </Heading>

          <Text textStyle="md" color="navy.200" position="relative" maxW="lg">
            Join 50+ sellers who are already selling with confidence.
          </Text>

          {/* Urgency badges */}
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            gap={3}
            position="relative"
            flexWrap="wrap"
            justify="center"
          >
            <Flex align="center" gap={1.5} bg="white/10" px={3} py={1.5} borderRadius="full">
              <LuClock size={14} color="white" />
              <Text textStyle="xs" color="white" fontWeight="medium">
                Only 15 spots left
              </Text>
            </Flex>
            <Flex align="center" gap={1.5} bg="white/10" px={3} py={1.5} borderRadius="full">
              <LuZap size={14} color="white" />
              <Text textStyle="xs" color="white" fontWeight="medium">
                Free during beta
              </Text>
            </Flex>
            <Flex align="center" gap={1.5} bg="white/10" px={3} py={1.5} borderRadius="full">
              <LuBadgeCheck size={14} color="white" />
              <Text textStyle="xs" color="white" fontWeight="medium">
                Approval in 24 hours
              </Text>
            </Flex>
          </Flex>

          <m.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ position: 'relative' }}>
            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button size="lg" bg="white" color="navy.900" _hover={{ bg: 'navy.50' }} px={10} py={6} textStyle="md" fontWeight="bold" boxShadow="xl">
                {ctaLabel}
              </Button>
            </Link>
          </m.div>

          {/* What happens next */}
          <Flex direction="column" gap={2} position="relative" align="flex-start" textAlign="left">
            <Text textStyle="xs" color="white" fontWeight="semibold" mb={1}>
              What happens next:
            </Text>
            {['Confirmation within 1 hour', 'Access to your ShopCop dashboard', 'Step-by-step verification guide', 'Support from our team'].map((item) => (
              <Flex key={item} align="center" gap={2}>
                <LuBadgeCheck size={14} color="var(--chakra-colors-primary-300)" />
                <Text textStyle="xs" color="navy.200">
                  {item}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Reveal>
    </Box>
  );
}
