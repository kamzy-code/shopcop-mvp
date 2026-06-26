'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuUserX, LuTimer, LuTrendingDown } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';
import { SectionEyebrow } from './SectionEyebrow';

const problems = [
  {
    icon: LuUserX,
    color: 'red',
    headline: 'Buyers Don\'t Know If You\'re Real',
    description: 'With no way to verify you, serious buyers assume the worst. They go to sellers with something that proves legitimacy.',
    example: 'Your profile is empty. No reviews. No verification. They message someone else.',
  },
  {
    icon: LuTimer,
    color: 'orange',
    headline: 'You Spend Hours Convincing Each Buyer',
    description: 'Instead of selling, you\'re defending yourself. \'Yes, it\'s real.\' \'No, I won\'t scam you.\' \'I\'ve been doing this for 3 years.\'',
    example: 'It takes 2 hours of back-and-forth to make 1 sale. Half the conversations go nowhere.',
  },
  {
    icon: LuTrendingDown,
    color: 'warning',
    headline: 'Losing Deals to Less Qualified Competitors',
    description: 'A seller with mediocre products but a \'verified\' badge is beating you — even though your quality is better.',
    example: 'Your dresses are better quality and cheaper. But they buy from someone else because \'at least they\'re verified.\'',
  },
];

export function ProblemSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} bg="bg.subtle" id="for-vendors">
      <Flex direction="column" align="center" maxW="5xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center" maxW="3xl">
            <SectionEyebrow label="The Problem" colorPalette="red" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Why Are Legitimate Sellers Losing Sales?
            </Text>
            <Text textStyle="sm" color="fg.muted">
              The biggest blocker for Nigerian social commerce — and why trust matters more than price.
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
          {problems.map((problem) => (
            <motion.div
              key={problem.headline}
              variants={staggerItem}
              style={{ flex: '1 1 280px', maxWidth: '360px', minWidth: '260px' }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
            >
              <Flex
                direction="column"
                bg="bg.panel"
                p={6}
                borderRadius="xl"
                borderTopWidth="4px"
                borderTopColor={`${problem.color}.400`}
                h="full"
                gap={4}
                transition="box-shadow 0.25s, transform 0.25s"
                _hover={{ boxShadow: 'xl' }}
              >
                <Flex
                  w={11}
                  h={11}
                  borderRadius="lg"
                  bg={`${problem.color}.subtle`}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={problem.icon} boxSize={5} color={`${problem.color}.fg`} />
                </Flex>

                <Box>
                  <Text fontWeight="bold" textStyle="md" color="fg" mb={2}>
                    {problem.headline}
                  </Text>
                  <Text textStyle="sm" color="fg.muted" mb={3}>
                    {problem.description}
                  </Text>
                  <Flex
                    bg={`${problem.color}.subtle`}
                    px={3}
                    py={2}
                    borderRadius="md"
                  >
                    <Text textStyle="xs" color={`${problem.color}.fg`} fontStyle="italic">
                      &ldquo;{problem.example}&rdquo;
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <Box textAlign="center" maxW="2xl" mt={2}>
            <Text textStyle="sm" color="fg.muted" fontStyle="italic">
              And the worst part? You&apos;re working harder than anyone, but no one knows it.
            </Text>
          </Box>
        </Reveal>
      </Flex>
    </Box>
  );
}
