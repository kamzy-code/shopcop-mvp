'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuShieldQuestion, LuUserX, LuBan, LuTriangle } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';

const problems = [
  { icon: LuUserX, text: 'Fake profiles impersonating real businesses' },
  { icon: LuBan, text: 'No accountability when sellers disappear after payment' },
  { icon: LuTriangle, text: 'Scams erode buyer confidence across social commerce' },
];

export function ProblemSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} bg="bg.subtle">
      <Flex direction="column" align="center" maxW="3xl" mx="auto" gap={8}>
        <Reveal>
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg="red.subtle"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <LuShieldQuestion size={24} color="var(--chakra-colors-red-500)" />
          </Flex>
        </Reveal>

        <Reveal delay={0.1}>
          <Box textAlign="center">
            <Text fontWeight="bold" textStyle="xl" color="fg" mb={2}>
              Why buyers don&apos;t trust sellers
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Social commerce is booming, but trust hasn&apos;t kept up.
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
          {problems.map((problem) => (
            <motion.div key={problem.text} variants={staggerItem}>
              <Flex
                align="center"
                gap={3}
                bg="bg.panel"
                px={4}
                py={3.5}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="border"
              >
                <Icon as={problem.icon} boxSize={5} color="red.400" flexShrink={0} />
                <Text textStyle="sm" color="fg">
                  {problem.text}
                </Text>
              </Flex>
            </motion.div>
          ))}
        </motion.div>
      </Flex>
    </Box>
  );
}
