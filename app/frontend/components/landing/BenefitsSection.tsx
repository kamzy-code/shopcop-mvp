'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuZap, LuBadgeCheck, LuTrendingUp } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';

const benefits = [
  {
    icon: LuZap,
    title: 'Get verified fast',
    description: 'Complete verification in under 24 hours with a simple document upload.',
  },
  {
    icon: LuBadgeCheck,
    title: 'Build your reputation',
    description: 'Earn trust with verified badges, ratings, and transparent reviews.',
  },
  {
    icon: LuTrendingUp,
    title: 'Make sales faster',
    description: 'Buyers purchase with confidence when they see you\'re verified on ShopCop.',
  },
];

export function BenefitsSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} bg="bg.subtle">
      <Flex direction="column" align="center" maxW="5xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center">
            <Text fontWeight="bold" textStyle="xl" color="fg" mb={2}>
              Why join ShopCop
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Three reasons sellers trust us to grow their business.
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
              style={{ flex: '1 1 250px', maxWidth: '350px', minWidth: '250px' }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <Flex
                direction="column"
                align="center"
                textAlign="center"
                bg="bg.panel"
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
                h="full"
                gap={4}
                transition="box-shadow 0.25s"
                _hover={{ boxShadow: 'lg', borderColor: 'primary.200' }}
              >
                <Flex
                  w={12}
                  h={12}
                  borderRadius="xl"
                  bg="primary.subtle"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={benefit.icon} boxSize={6} color="primary.500" />
                </Flex>
                <Box>
                  <Text fontWeight="semibold" textStyle="md" color="fg" mb={1}>
                    {benefit.title}
                  </Text>
                  <Text textStyle="sm" color="fg.muted">
                    {benefit.description}
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
