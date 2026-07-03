'use client';
import { Box, Text, chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';

import { LuBadgeCheck, LuLink, LuSearchCheck, LuTruck } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from '@/components/landing/Reveal';
import { SectionEyebrow } from '@/components/landing/SectionEyebrow';
import { ProcessStep } from './ProcessStep';

const MotionGrid = chakra(motion.div);

const steps = [
  {
    icon: LuBadgeCheck,
    step: '1',
    title: 'Get Verified',
    description:
      'Complete your ShopCop profile check — ID, business details, and payment info verified in one go.',
  },
  {
    icon: LuLink,
    step: '2',
    title: 'Get Your Link',
    description:
      'One shareable link that works across all your social platforms — Instagram, WhatsApp, and TikTok.',
  },
  {
    icon: LuSearchCheck,
    step: '3',
    title: 'Buyers Check, Then Buy',
    description:
      'Buyers see your verified badge and transaction history, and buy with confidence, no back-and-forth.',
  },
  {
    icon: LuTruck,
    step: '4',
    title: 'Track Without the Back-and-Forth',
    description:
      'A shared tracking link updates your buyer automatically, so you don’t have to keep answering "is it coming?"',
  },
];

export function ProcessSection() {
  return (
    <Box
      as="section"
      id="process"
      py={{ base: 14, md: 20 }}
      px={4}
      bg="primary.300"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.25}
        zIndex={0}
        style={{
          backgroundImage: 'url(/pattern_overlay.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Box maxW="5xl" mx="auto">
        <Reveal>
          <Box textAlign="center" maxW="2xl" mx="auto" mb={12}>
            <SectionEyebrow label="Our Process" colorPalette="primary" />
            <Text
              fontWeight="extrabold"
              textStyle={{ base: '2xl', md: '3xl' }}
              color="black"
              letterSpacing="tight"
            >
              From &lsquo;convince me&rsquo; to &lsquo;sold&rsquo; in four steps.
            </Text>
            <Text textStyle="sm" color="primary.800">
              A clear, repeatable process that replaces back-and-forth with proof.
            </Text>
          </Box>
        </Reveal>

        <MotionGrid
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          display="grid"
          gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={8}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={staggerItem}
              className="flex flex-col items-center"
            >
              <ProcessStep {...step} isLast={i === steps.length - 1} />
            </motion.div>
          ))}
        </MotionGrid>
      </Box>
    </Box>
  );
}
