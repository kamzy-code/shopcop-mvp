'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuShieldCheck, LuFingerprint, LuFileText, LuClock } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';

const steps = [
  { icon: LuFingerprint, text: 'Submit identity verification (NIN or government ID)' },
  { icon: LuFileText, text: 'Provide business documents (CAC, SMEDAN registration)' },
  { icon: LuClock, text: 'Get verified in under 24 hours' },
];

export function SolutionSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4}>
      <Flex direction="column" align="center" maxW="3xl" mx="auto" gap={8}>
        <Reveal>
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg="primary.subtle"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <LuShieldCheck size={24} color="var(--chakra-colors-primary-500)" />
          </Flex>
        </Reveal>

        <Reveal delay={0.1}>
          <Box textAlign="center">
            <Text fontWeight="bold" textStyle="xl" color="fg" mb={2}>
              How ShopCop helps
            </Text>
            <Text textStyle="sm" color="fg.muted">
              We verify sellers so buyers can shop with confidence.
            </Text>
          </Box>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {steps.map((step) => (
            <motion.div key={step.text} variants={staggerItem}>
              <Flex
                align="center"
                gap={3}
                bg="bg.panel"
                px={4}
                py={3.5}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="border"
                _hover={{ borderColor: 'primary.300', bg: 'primary.subtle' }}
                transition="all 0.2s"
              >
                <Flex
                  w={8}
                  h={8}
                  borderRadius="md"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={step.icon} boxSize={4} color="primary.500" />
                </Flex>
                <Text textStyle="sm" color="fg">
                  {step.text}
                </Text>
              </Flex>
            </motion.div>
          ))}
        </motion.div>
      </Flex>
    </Box>
  );
}
