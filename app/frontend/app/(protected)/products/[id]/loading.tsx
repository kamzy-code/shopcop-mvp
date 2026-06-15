import { Box, Flex, Grid, Stack } from '@chakra-ui/react';

export default function ProductDetailLoading() {
  return (
    <Stack gap={6}>
      <Flex align="center" gap={3}>
        <Box w={8} h={8} bg="bg.subtle" borderRadius="md" />
        <Box w="200px" h={6} bg="bg.subtle" borderRadius="md" />
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
        <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" overflow="hidden">
          <Box w="full" h="400px" bg="bg.subtle" />
        </Box>

        <Stack gap={5}>
          <Box w="80%" h={7} bg="bg.subtle" borderRadius="md" />
          <Box w="60px" h={6} bg="bg.subtle" borderRadius="md" />
          <Box w="full" h={3} bg="bg.subtle" borderRadius="md" />
          <Box w="full" h={3} bg="bg.subtle" borderRadius="md" />
          <Box w="60%" h={3} bg="bg.subtle" borderRadius="md" />
          <Flex gap={2} mt={2}>
            <Box w="24px" h="24px" borderRadius="full" bg="bg.subtle" />
            <Box w="60px" h={4} bg="bg.subtle" borderRadius="md" />
          </Flex>
          <Flex gap={3} mt={4}>
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
            <Box flex={1} h="40px" bg="bg.subtle" borderRadius="lg" />
          </Flex>
        </Stack>
      </Grid>
    </Stack>
  );
}
