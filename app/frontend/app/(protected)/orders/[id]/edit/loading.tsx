import { Box, Flex, Stack } from '@chakra-ui/react';

export default function EditOrderLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" gap={3}>
        <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
        <Box w="180px" h={6} bg="bg.subtle" borderRadius="md" />
      </Flex>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
        <Stack gap={5}>
          <Box w="160px" h={6} bg="bg.subtle" borderRadius="md" />
          <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
          <Flex gap={4}>
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
          </Flex>
          <Box w="full" h="100px" bg="bg.subtle" borderRadius="lg" />
        </Stack>
      </Box>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
        <Stack gap={3}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Flex key={i} align="center" gap={4} p={3} bg="bg.subtle" borderRadius="lg">
              <Box w={10} h={10} borderRadius="md" bg="bg.panel" />
              <Box flex={1}>
                <Box w="40%" h={3} bg="bg.panel" borderRadius="md" mb={1.5} />
                <Box w="25%" h={3} bg="bg.panel" borderRadius="md" />
              </Box>
              <Box w="80px" h={3} bg="bg.panel" borderRadius="md" />
            </Flex>
          ))}
        </Stack>
      </Box>

      <Flex justify="space-between">
        <Box w="100px" h="40px" bg="bg.subtle" borderRadius="lg" />
        <Box w="120px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>
    </Stack>
  );
}
