'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuZap, LuBadgeCheck, LuTrendingUp, LuDollarSign, LuMessageSquare, LuCrown } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';
import { SectionEyebrow } from './SectionEyebrow';

const benefits = [
  {
    icon: LuZap,
    title: 'Sell Faster',
    description: 'Close deals 2-3x faster. No more 2-hour convincing sessions. Buyers see you\'re verified and purchase with confidence.',
    metric: 'Deal time: 2 hours → 30 minutes',
  },
  {
    icon: LuTrendingUp,
    title: 'Get Repeat Customers',
    description: 'Real reviews + real reputation = customers who buy again and again. One-time sales become repeat revenue.',
    metric: '42% of verified sellers get repeat buyers',
  },
  {
    icon: LuDollarSign,
    title: 'Stop Haggling',
    description: 'Buyers trust you won\'t scam them, so they stop negotiating. You keep more profit per sale.',
    metric: 'Average price increase: 15-20%',
  },
  {
    icon: LuMessageSquare,
    title: 'Get Real Feedback',
    description: 'Honest reviews tell you what\'s working and what needs improvement. Build better products with every sale.',
    metric: 'Actionable feedback with every review',
  },
  {
    icon: LuCrown,
    title: 'Stand Out from Competitors',
    description: 'When buyers can see your metrics — completion rate, response time — you win on trust, not just price.',
    metric: 'Verified badge = 3x more inquiries',
  },
  {
    icon: LuBadgeCheck,
    title: 'Join Verified Community',
    description: 'Connect with other ShopCop sellers, share tips, collaborate, and grow together. You\'re not alone.',
    metric: '50+ sellers and growing',
  },
];

export function BenefitsSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} id="benefits">
      <Flex direction="column" align="center" maxW="6xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center">
            <SectionEyebrow label="What You Get" colorPalette="accent" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Tangible Outcomes, Not Just Features
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Here&apos;s what changes when buyers see your verified badge.
            </Text>
          </Box>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={staggerItem}
              style={{ flex: '1 1 280px', maxWidth: '360px', minWidth: '260px' }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <Flex
                direction="column"
                bg="bg.panel"
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
                h="full"
                gap={4}
                transition="box-shadow 0.25s, border-color 0.25s"
                _hover={{ boxShadow: 'xl', borderColor: 'accent.300' }}
              >
                <Flex
                  w={11}
                  h={11}
                  borderRadius="xl"
                  bg="accent.subtle"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={benefit.icon} boxSize={5} color="accent.fg" />
                </Flex>

                <Box>
                  <Text fontWeight="bold" textStyle="md" color="fg" mb={1}>
                    {benefit.title}
                  </Text>
                  <Text textStyle="sm" color="fg.muted" mb={3}>
                    {benefit.description}
                  </Text>
                  <Flex
                    bg="accent.subtle"
                    px={3}
                    py={1.5}
                    borderRadius="md"
                    display="inline-flex"
                    align="center"
                    gap={1.5}
                  >
                    <Box w={1.5} h={1.5} borderRadius="full" bg="accent.500" />
                    <Text textStyle="xs" color="accent.fg" fontWeight="semibold">
                      {benefit.metric}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </motion.div>
          ))}
        </motion.div>
      </Flex>
    </Box>
  );
}
