import { Box, Flex, Stack } from '@chakra-ui/react';

export default function NewProductLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" gap={3}>
        <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
        <Box w="160px" h={6} bg="bg.subtle" borderRadius="md" />
      </Flex>

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
        <Stack gap={5}>
          <Flex gap={4}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Box key={i} flex={1} p={4} bg="bg.subtle" borderRadius="lg" textAlign="center">
                <Box w={8} h={8} bg="bg.panel" borderRadius="md" mb={2} display="inline-block" />
                <Box w="80px" h={3} bg="bg.panel" borderRadius="md" mx="auto" />
              </Box>
            ))}
          </Flex>

          <Stack gap={4}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Box key={i}>
                <Box w="80px" h={3} bg="bg.subtle" borderRadius="md" mb={2} />
                <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
              </Box>
            ))}
            <Box w="full" h="100px" bg="bg.subtle" borderRadius="lg" />
          </Stack>
        </Stack>
      </Box>

      <Flex justify="flex-end">
        <Box w="120px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>
    </Stack>
  );
}
