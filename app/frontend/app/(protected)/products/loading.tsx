import { Box, Flex, Grid, Stack } from '@chakra-ui/react';

function ProductCardSkeleton() {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
      <Box w="full" h="180px" bg="bg.subtle" />
      <Box p={4}>
        <Box w="70%" h={4} bg="bg.subtle" borderRadius="md" mb={2} />
        <Box w="40%" h={3} bg="bg.subtle" borderRadius="md" mb={3} />
        <Flex align="center" justify="space-between" mb={3}>
          <Box w="60px" h={5} bg="bg.subtle" borderRadius="md" />
          <Box w="70px" h="22px" bg="bg.subtle" borderRadius="full" />
        </Flex>
        <Flex gap={2}>
          <Box flex={1} h="32px" bg="bg.subtle" borderRadius="lg" />
          <Box flex={1} h="32px" bg="bg.subtle" borderRadius="lg" />
          <Box flex={1} h="32px" bg="bg.subtle" borderRadius="lg" />
        </Flex>
      </Box>
    </Box>
  );
}

export default function ProductsLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Box w="160px" h={7} bg="bg.subtle" borderRadius="md" />
          <Box w="100px" h={3} bg="bg.subtle" borderRadius="md" />
        </Stack>
        <Box w="130px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Box w="360px" h="40px" bg="bg.subtle" borderRadius="lg" />

      <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }} gap={4}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </Grid>
    </Stack>
  );
}
