'use client';
import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Reveal, staggerContainer, staggerItem } from '@/components/landing/Reveal';
import { SectionEyebrow } from '@/components/landing/SectionEyebrow';
import { TestimonialCard } from './TestimonialCard';

const testimonials = [
  {
    quote:
      "The tracking link alone stopped 90% of my 'where is my order' messages. Buyers just check it themselves now.",
    name: 'Fatima B.',
    role: 'Home Goods Vendor',
  },
  {
    quote: "The tracking link alone stopped 90% of my 'where is my order' messages, freeing up my whole day.",
    name: 'Fatima B.',
    role: 'Home Goods Vendor',
  },
  {
    quote: "Verification took ten minutes. The trust it's built now with strangers is worth way more than that.",
    name: 'Bola B.',
    role: 'Accessories Vendor',
  },
  {
    quote: "Buyers used to ghost me after delivery. Now they see my fulfillment rate before they even message.",
    name: 'Tunde A.',
    role: 'Electronics Vendor',
  },
  {
    quote: "Buyers used to ghost me after delivery. Now they see my fulfillment rate before they even ask.",
    name: 'Tunde A.',
    role: 'Electronics Vendor',
  },
  {
    quote: "Buyers used to ghost me after delivery. Now my verified badge does the talking before I say a word.",
    name: 'Tunde A.',
    role: 'Electronics Vendor',
  },
];

export function TestimonialsSection() {
  return (
    <Box as="section" id="testimonials" py={{ base: 14, md: 20 }} px={4} bg="bg">
      <Box maxW="6xl" mx="auto">
        <Reveal>
          <Box textAlign="center" maxW="2xl" mx="auto" mb={12}>
            <SectionEyebrow label="In Their Words" colorPalette="primary" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Trusted by independent vendors
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Vendors across WhatsApp, Instagram, and TikTok tell us what verification changed for them.
            </Text>
          </Box>
        </Reveal>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
            {testimonials.map((t, i) => (
              <motion.div key={`${t.name}-${i}`} variants={staggerItem} style={{ height: '100%' }}>
                <TestimonialCard {...t} />
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>
      </Box>
    </Box>
  );
}
