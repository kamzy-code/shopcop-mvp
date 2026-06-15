import { Box, Flex, Stack } from '@chakra-ui/react';

interface CardSkeletonProps {
  lines?: number;
  height?: string;
}

export function CardSkeleton({ lines = 3, height }: CardSkeletonProps) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4} h={height}>
      <Stack gap={2}>
        {Array.from({ length: lines }).map((_, i) => (
          <Box
            key={i}
            h={3}
            w={`${[80, 60, 40, 30][i] || 50}%`}
            bg="bg.subtle"
            borderRadius="md"
          />
        ))}
      </Stack>
    </Box>
  );
}

export function StatCardSkeleton() {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box w={10} h={10} borderRadius="lg" bg="bg.subtle" />
        <Box w={3} h={3} bg="bg.subtle" borderRadius="full" />
      </Flex>
      <Box w="60px" h={3} bg="bg.subtle" borderRadius="md" mb={2} />
      <Box w="100px" h={6} bg="bg.subtle" borderRadius="md" mb={1.5} />
      <Box w="80px" h={2.5} bg="bg.subtle" borderRadius="md" />
    </Box>
  );
}
