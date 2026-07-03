'use client';
import { Box, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface StatCardProps {
  value: string;
  caption: string;
}

export function StatCard({ value, caption }: StatCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      bg="bg.panel"
      p={{ base: 6, md: 8 }}
      boxShadow="md"
      textAlign="center"
      w="full"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'backOut' }}
      >
        <Text
          fontWeight="black"
          textStyle={{ base: '5xl', md: '6xl' }}
          color="primary.fg"
          letterSpacing="tighter"
          lineHeight="1"
          mb={3}
        >
          {value}
        </Text>
      </motion.div>
      <Text textStyle="sm" color="fg.muted" lineHeight="1.6">
        {caption}
      </Text>
    </Box>
  );
}
