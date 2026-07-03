'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Reveal } from '@/components/landing/Reveal';
import { StatCard } from './StatCard';

export function ProblemStatSection() {
  return (
    <Box as="section" py={{ base: 14, md: 20 }} px={{ base: 8, md: 24 }} bg="bg">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify={'space-between'}
        maxW={'8xl'}
        w="full"
        mx="auto"
        gap={{ base: 10, md: 16 }}
      >
        <Box flex={1.2} maxW={'4xl'}>
          <Reveal>
            <Text
              fontWeight="extrabold"
              textStyle={{ base: '2xl', md: '3xl' }}
              color="primary.fg"
              mb={4}
              letterSpacing="tight"
              lineHeight="1.15"
            >
              You shouldn&apos;t have to prove you&apos;re real in every single chat.
            </Text>
            <Text textStyle={{ base: 'sm', md: 'md' }} color="fg.muted" lineHeight="1.7">
              Right now, every new customer means starting from zero — sending old transaction
              screenshots, delivery photos, reviews, anything to show you&apos;re legit. You built
              your reputation, but strangers can&apos;t see it from a few posts and comments. And
              even after all that effort, some buyers still disappear, renegotiate after delivery,
              or refuse to pay.
            </Text>
          </Reveal>
        </Box>

        <Box flex={1} w="full" maxW={{ base: 'full', md: '320px' }}>
          <Reveal delay={0.15}>
            <StatCard
              value="40%"
              caption="of every new customer conversation spent just proving you're legitimate, before the actual selling even starts."
            />
          </Reveal>
        </Box>
      </Flex>
    </Box>
  );
}
