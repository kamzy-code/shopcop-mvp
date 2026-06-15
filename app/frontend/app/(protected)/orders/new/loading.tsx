import { Box, Flex, Stack } from '@chakra-ui/react';

export default function NewOrderLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" gap={3}>
        <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
        <Box w="140px" h={6} bg="bg.subtle" borderRadius="md" />
      </Flex>

      <Box w="full" h={2} bg="bg.subtle" borderRadius="full" />

      <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
        <Stack gap={5}>
          <Box w="180px" h={6} bg="bg.subtle" borderRadius="md" />
          <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
          <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
          <Flex gap={4}>
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
          </Flex>
          <Box w="full" h="100px" bg="bg.subtle" borderRadius="lg" />
        </Stack>
      </Box>

      <Flex justify="space-between">
        <Box w="100px" h="40px" bg="bg.subtle" borderRadius="lg" />
        <Box w="120px" h="40px" bg="bg.subtle" borderRadius="lg" />
      </Flex>
    </Stack>
  );
}
