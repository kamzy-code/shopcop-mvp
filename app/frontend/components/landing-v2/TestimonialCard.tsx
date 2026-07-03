'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
}

export function TestimonialCard({ quote, name, role }: TestimonialCardProps) {
  const initial = name.charAt(0);

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
      <Flex
        direction="column"
        justify="space-between"
        h="full"
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="xl"
        p={6}
        gap={5}
        boxShadow="sm"
      >
        <Text textStyle="sm" color="fg.muted" lineHeight="1.7">
          &ldquo;{quote}&rdquo;
        </Text>
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
            <Text textStyle="sm" fontWeight="bold" color="primary.fg">
              {initial}
            </Text>
          </Flex>
          <Box>
            <Text textStyle="sm" fontWeight="semibold" color="fg">
              {name}
            </Text>
            <Text textStyle="xs" color="fg.subtle">
              {role}
            </Text>
          </Box>
        </Flex>
      </Flex>
    </motion.div>
  );
}
