import { Box, Flex, Grid, Stack } from '@chakra-ui/react';

function SkeletonBox({ h, w }: { h?: string; w?: string }) {
  return <Box h={h ?? 'full'} w={w ?? 'full'} bg="bg.subtle" borderRadius="lg" />;
}

function StatCardSkeleton() {
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

export default function DashboardLoading() {
  return (
    <Stack gap={8}>
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1.5}>
          <Box w="220px" h={7} bg="bg.subtle" borderRadius="md" />
          <Box w="160px" h={4} bg="bg.subtle" borderRadius="md" />
        </Stack>
        <Box w="130px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
        <Flex align="center" gap={4}>
          <Box w={10} h={10} borderRadius="lg" bg="bg.subtle" />
          <Box flex={1}>
            <Box w="160px" h={4} bg="bg.subtle" borderRadius="md" mb={2} />
            <Box w="240px" h={3} bg="bg.subtle" borderRadius="md" />
          </Box>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </Grid>

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
          <Box w="140px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
          <Stack gap={3}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Flex key={i} align="center" justify="space-between">
                <Flex align="center" gap={3}>
                  <Box w={5} h={5} borderRadius="full" bg="bg.subtle" />
                  <Box w="100px" h={3} bg="bg.subtle" borderRadius="md" />
                </Flex>
                <Box w={5} h={5} borderRadius="full" bg="bg.subtle" />
              </Flex>
            ))}
          </Stack>
        </Box>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
          <Box w="120px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
          <Flex align="center" justify="space-between" mb={4}>
            <Box w="100px" h={3} bg="bg.subtle" borderRadius="md" />
            <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
          </Flex>
          <Stack gap={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Flex key={i} align="center" gap={3} p={3} bg="bg.subtle" borderRadius="lg">
                <Box w={8} h={8} borderRadius="md" bg="bg.panel" />
                <Box flex={1}>
                  <Box w="60%" h={3} bg="bg.panel" borderRadius="md" mb={1} />
                  <Box w="40%" h={2.5} bg="bg.panel" borderRadius="md" />
                </Box>
              </Flex>
            ))}
          </Stack>
        </Box>
      </Grid>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
        <Box w="180px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} h="260px" bg="bg.subtle" borderRadius="xl" />
          ))}
        </Grid>
      </Box>
    </Stack>
  );
}
