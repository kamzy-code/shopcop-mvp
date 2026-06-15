import { Box, Flex, Grid, Stack } from '@chakra-ui/react';

export default function OrderDetailLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" gap={3}>
        <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
        <Box w="160px" h={6} bg="bg.subtle" borderRadius="md" />
      </Flex>

      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Box w="200px" h={7} bg="bg.subtle" borderRadius="md" />
          <Box w="140px" h={4} bg="bg.subtle" borderRadius="md" />
        </Stack>
        <Flex gap={3}>
          <Box w="100px" h="36px" bg="bg.subtle" borderRadius="lg" />
          <Box w="100px" h="36px" bg="bg.subtle" borderRadius="lg" />
        </Flex>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 300px' }} gap={6}>
        <Stack gap={6}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Box w="120px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
            <Stack gap={3}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Flex key={i} align="center" gap={4} p={3} bg="bg.subtle" borderRadius="lg">
                  <Box w={12} h={12} borderRadius="md" bg="bg.panel" />
                  <Box flex={1}>
                    <Box w="50%" h={3} bg="bg.panel" borderRadius="md" mb={1.5} />
                    <Box w="30%" h={3} bg="bg.panel" borderRadius="md" />
                  </Box>
                  <Box w="70px" h={4} bg="bg.panel" borderRadius="md" />
                </Flex>
              ))}
            </Stack>
          </Box>

          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
            <Box w="100px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
            <Box h="200px" bg="bg.subtle" borderRadius="lg" />
          </Box>
        </Stack>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={5}>
          <Box w="100px" h={5} bg="bg.subtle" borderRadius="md" mb={4} />
          <Stack gap={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Flex key={i} gap={3}>
                <Box w={6} h={6} borderRadius="full" bg="bg.subtle" />
                <Box flex={1}>
                  <Box w="80%" h={3} bg="bg.subtle" borderRadius="md" mb={1.5} />
                  <Box w="50%" h={2.5} bg="bg.subtle" borderRadius="md" />
                </Box>
              </Flex>
            ))}
          </Stack>
        </Box>
      </Grid>
    </Stack>
  );
}
