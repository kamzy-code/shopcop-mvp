'use client';
import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaInstagram, FaTiktok, FaWhatsapp, FaArrowRight } from 'react-icons/fa6';
import { Reveal, staggerContainer, staggerItem } from '@/components/landing/Reveal';
import { PlatformBadge } from './PlatformBadge';

const platforms = [
  { icon: FaInstagram, label: 'Instagram' },
  { icon: FaWhatsapp, label: 'WhatsApp' },
  { icon: FaTiktok, label: 'TikTok' },
  { icon: FaArrowRight, label: '' },
  { label: 'ShopCop', highlight: true },
];

export function MissionSection() {
  return (
    <Box as="section" py={{ base: 16, md: 20 }} px={4} bg="primary.900">
      <Box maxW="4xl" mx="auto" textAlign="center">
        <Reveal>
          <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="white" mb={5} letterSpacing="tight" lineHeight="1.25">
            Our mission is to empower independent social commerce vendors by providing a simple, fast way to
            establish trust, turning casual visitors into long-term loyal customers
          </Text>
        </Reveal>

        <Reveal delay={0.1}>
          <Text textStyle={{ base: 'sm', md: 'md' }} color="navy.200" lineHeight="1.7" mb={9}>
            ShopCop isn&apos;t a new place to sell — it&apos;s a verification layer that works underneath Instagram,
            WhatsApp, and TikTok. Get verified once, and that proof travels with you: into every DM, every product
            post, every new customer conversation. No onboarding, no re-explaining, no starting over each time.
          </Text>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}
        >
          {platforms.map((p) => (
            <motion.div key={p.label} variants={staggerItem}>
              <PlatformBadge icon={p.icon} label={p.label} highlight={p.highlight} />
            </motion.div>
          ))}
        </motion.div>
      </Box>
    </Box>
  );
}
