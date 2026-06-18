'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuBadgeCheck, LuShieldCheck, LuChartBar } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';

const solutions = [
  {
    icon: LuShieldCheck,
    headline: 'Get Verified in 24 Hours',
    description: 'Upload your government ID, proof of address, and business documents. ShopCop verifies them. You get a badge that proves you\'re real.',
    benefit: 'Buyers see the badge → instant trust',
  },
  {
    icon: LuBadgeCheck,
    headline: 'Build Real Reputation',
    description: 'Every transaction generates authentic reviews from actual buyers. No fake reviews. No gaming the system. Your reputation speaks for itself.',
    benefit: 'Over time, your track record closes deals for you',
  },
  {
    icon: LuChartBar,
    headline: 'Display Your Metrics',
    description: 'Your completion rate, response time, and customer satisfaction score — all visible to buyers. Proof that you deliver what you promise.',
    benefit: 'You\'re chosen because you\'re reliable, not because you\'re cheap',
  },
];

export function SolutionSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4}>
      <Flex direction="column" align="center" maxW="5xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center" maxW="3xl">
            <Text fontWeight="bold" textStyle={{ base: 'xl', md: '2xl' }} color="fg" mb={3}>
              How ShopCop Changes Everything
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Here&apos;s exactly how it works.
            </Text>
          </Box>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px' }}
        >
          {solutions.map((solution) => (
            <motion.div key={solution.headline} variants={staggerItem}>
              <Flex
                align="flex-start"
                gap={4}
                bg="bg.panel"
                p={5}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
                _hover={{ borderColor: 'primary.300', bg: 'primary.subtle' }}
                transition="all 0.2s"
              >
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg="success.subtle"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  mt={0.5}
                >
                  <Icon as={solution.icon} boxSize={5} color="success.500" />
                </Flex>
                <Box flex={1}>
                  <Text fontWeight="semibold" textStyle="md" color="fg" mb={1}>
                    {solution.headline}
                  </Text>
                  <Text textStyle="sm" color="fg.muted" mb={2}>
                    {solution.description}
                  </Text>
                  <Text textStyle="xs" color="success.600" fontWeight="medium">
                    {solution.benefit}
                  </Text>
                </Box>
              </Flex>
            </motion.div>
          ))}
        </motion.div>
      </Flex>
    </Box>
  );
}
