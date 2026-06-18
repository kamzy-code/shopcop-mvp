'use client';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { LuStar, LuThumbsUp, LuClock, LuBadgeCheck } from 'react-icons/lu';
import { Reveal, staggerContainer, staggerItem } from './Reveal';

const testimonials = [
  {
    name: 'Chioma',
    role: 'Fashion Vendor',
    quote: 'Buyers used to haggle like crazy about price, asking \'Is it real?\' \'Why should I trust you?\' Now they see the badge, they trust me instantly. Made 5 sales in 3 days (used to take 2 weeks).',
    rating: 5,
  },
  {
    name: 'Ahmed',
    role: 'Frequent Buyer',
    quote: 'Been scammed 3 times buying online. Finally can buy without the paranoia. Verified badges + real reviews = I actually enjoy shopping online now.',
    rating: 5,
  },
];

const stats = [
  { icon: LuThumbsUp, value: '87%', label: 'say it helped them sell more' },
  { icon: LuClock, value: '95%', label: 'approval rate in 24 hours' },
  { icon: LuBadgeCheck, value: '150+', label: 'transactions completed' },
];

export function ProofSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} id="proof">
      <Flex direction="column" align="center" maxW="5xl" mx="auto" gap={10}>
        <Reveal>
          <Box textAlign="center">
            <Text fontWeight="bold" textStyle={{ base: 'xl', md: '2xl' }} color="fg" mb={3}>
              Early Users Are Already Winning
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Real sellers, real buyers — real results.
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
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={staggerItem}
              style={{ flex: '1 1 300px', maxWidth: '480px', minWidth: '280px' }}
            >
              <Flex
                direction="column"
                bg="bg.panel"
                p={6}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="border"
                gap={4}
              >
                <Flex align="center" gap={3}>
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="primary.subtle"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Text fontWeight="bold" textStyle="sm" color="primary.fg">
                      {t.name[0]}
                    </Text>
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" textStyle="sm" color="fg">
                      {t.name}
                    </Text>
                    <Text textStyle="xs" color="fg.subtle">
                      {t.role}
                    </Text>
                  </Box>
                  <Flex ml="auto" gap={0.5}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Icon key={i} as={LuStar} boxSize={3.5} color="orange.400" fill="orange.400" />
                    ))}
                  </Flex>
                </Flex>
                <Text textStyle="sm" color="fg.muted" fontStyle="italic" lineHeight="1.6">
                  &ldquo;{t.quote}&rdquo;
                </Text>
              </Flex>
            </motion.div>
          ))}
        </motion.div>

        <Reveal delay={0.3}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={6}
            justify="center"
            w="full"
          >
            {stats.map((stat) => (
              <Flex
                key={stat.label}
                direction="column"
                align="center"
                textAlign="center"
                bg="bg.subtle"
                px={6}
                py={4}
                borderRadius="lg"
                flex={1}
                gap={1}
              >
                <Icon as={stat.icon} boxSize={5} color="primary.500" />
                <Text fontWeight="bold" textStyle="lg" color="fg">
                  {stat.value}
                </Text>
                <Text textStyle="xs" color="fg.subtle">
                  {stat.label}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Reveal>
      </Flex>
    </Box>
  );
}
