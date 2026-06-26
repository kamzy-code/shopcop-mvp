'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuUserPlus, LuFileCheck, LuRocket } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';
import { SectionEyebrow } from './SectionEyebrow';

const steps = [
  {
    icon: LuUserPlus,
    step: '1',
    headline: 'Sign Up',
    description: 'Create your account with email and business name.',
    time: '2 minutes',
  },
  {
    icon: LuFileCheck,
    step: '2',
    headline: 'Get Verified',
    description: 'Upload your government ID, address proof, and business documents. We verify them.',
    time: '24 hours',
  },
  {
    icon: LuRocket,
    step: '3',
    headline: 'Start Selling',
    description: 'Share your public profile on WhatsApp, TikTok, Instagram. Buyers see you\'re verified.',
    time: 'Immediate',
  },
];

export function HowItWorksSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} bg="bg.subtle" id="how-it-works">
      <Flex direction="column" align="center" maxW="5xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center">
            <SectionEyebrow label="How It Works" colorPalette="primary" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Get Started in 3 Steps
            </Text>
            <Text textStyle="sm" color="fg.muted">
              From sign-up to first verified sale: usually under 1 day.
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
          {steps.map((step, i) => (
            <motion.div
              key={step.headline}
              variants={staggerItem}
              style={{ flex: '1 1 220px', maxWidth: '320px', minWidth: '220px', position: 'relative' }}
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <Box
                  display={{ base: 'none', md: 'block' }}
                  position="absolute"
                  top="40px"
                  left="calc(50% + 60px)"
                  right="-40px"
                  h="2px"
                  bg="primary.200"
                  zIndex={0}
                />
              )}

              <Flex
                direction="column"
                align="center"
                textAlign="center"
                bg="bg.panel"
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
                position="relative"
                zIndex={1}
                gap={4}
                boxShadow="md"
                _hover={{ boxShadow: 'xl' }}
                transition="box-shadow 0.25s"
              >
                <Flex
                  w={16}
                  h={16}
                  borderRadius="full"
                  bg="primary.500"
                  align="center"
                  justify="center"
                  position="relative"
                  boxShadow="lg"
                >
                  <step.icon size={26} color="white" />
                  <Flex
                    position="absolute"
                    top={-2}
                    right={-2}
                    w={7}
                    h={7}
                    borderRadius="full"
                    bg="navy.900"
                    align="center"
                    justify="center"
                    borderWidth="2px"
                    borderColor="bg.panel"
                  >
                    <Text textStyle="xs" color="white" fontWeight="bold">
                      {step.step}
                    </Text>
                  </Flex>
                </Flex>

                <Box>
                  <Text fontWeight="semibold" textStyle="md" color="fg" mb={1}>
                    {step.headline}
                  </Text>
                  <Text textStyle="sm" color="fg.muted" mb={2}>
                    {step.description}
                  </Text>
                  <Flex
                    display="inline-flex"
                    align="center"
                    gap={1}
                    bg="bg.subtle"
                    px={2.5}
                    py={1}
                    borderRadius="full"
                  >
                    <Text textStyle="xs" color="primary.500" fontWeight="medium">
                      {step.time}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <Box
            bg="primary.subtle"
            px={6}
            py={3}
            borderRadius="lg"
            textAlign="center"
          >
            <Text textStyle="sm" color="primary.fg" fontWeight="semibold">
              From sign-up to first verified sale: Usually under 1 day. That&apos;s how fast trust works.
            </Text>
          </Box>
        </Reveal>
      </Flex>
    </Box>
  );
}
