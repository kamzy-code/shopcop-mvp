import { Box, Flex, Stack } from '@chakra-ui/react';

function OrderCardSkeleton() {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={4}>
      <Stack gap={2}>
        <Flex align="flex-start" justify="space-between" mb={2}>
          <Stack gap={1}>
            <Box w="140px" h={3} bg="bg.subtle" borderRadius="md" />
            <Box w="80px" h={4} bg="bg.subtle" borderRadius="md" />
          </Stack>
          <Box w="70px" h="22px" bg="bg.subtle" borderRadius="full" />
        </Flex>
        <Box w="200px" h={3} bg="bg.subtle" borderRadius="md" />
        <Flex align="center" justify="space-between" mt={2}>
          <Box w="80px" h={4} bg="bg.subtle" borderRadius="md" />
          <Box w="60px" h={3} bg="bg.subtle" borderRadius="md" />
        </Flex>
      </Stack>
    </Box>
  );
}

export default function OrdersLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between" flexWrap="wrap" gap={4}>
        <Stack gap={1}>
          <Box w="120px" h={7} bg="bg.subtle" borderRadius="md" />
          <Box w="80px" h={3} bg="bg.subtle" borderRadius="md" />
        </Stack>
        <Box w="120px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Flex gap={3} flexWrap="wrap" align="center">
        <Box w="360px" h="40px" bg="bg.subtle" borderRadius="lg" />
        <Box w="130px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Flex gap={3} flexWrap="wrap" align="center">
        <Box w="160px" h="36px" bg="bg.subtle" borderRadius="lg" />
        <Box w="20px" h={3} bg="bg.subtle" borderRadius="md" />
        <Box w="160px" h="36px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Flex gap={2} flexWrap="wrap">
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i} h="28px" w="80px" bg="bg.subtle" borderRadius="full" />
        ))}
      </Flex>

      <Stack gap={3}>
        {Array.from({ length: 5 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </Stack>
    </Stack>
  );
}
