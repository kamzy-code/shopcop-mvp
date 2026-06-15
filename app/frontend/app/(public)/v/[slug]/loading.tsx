import { Box, Flex, Grid, Stack, Text } from '@chakra-ui/react';

export default function PublicVendorLoading() {
  return (
    <Box minH="100dvh" bg="bg">
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={{ base: 4, md: 8 }}
        h="64px"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.panel"
      >
        <Flex align="center" gap={2.5}>
          <Box w={8} h={8} borderRadius="lg" bg="primary.subtle" />
          <Box w="90px" h={5} bg="bg.subtle" borderRadius="md" />
        </Flex>
        <Box w="100px" h="36px" bg="bg.subtle" borderRadius="lg" />
      </Flex>

      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6, lg: 8 }} py={8}>
        <Stack gap={8}>
          <Box bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl" p={6}>
            <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={5}>
              <Box w={20} h={20} borderRadius="full" bg="bg.subtle" flexShrink={0} />
              <Box flex={1} textAlign={{ base: 'center', md: 'left' }}>
                <Box w="180px" h={6} bg="bg.subtle" borderRadius="md" mb={2} mx={{ base: 'auto', md: '0' }} />
                <Box w="120px" h={4} bg="bg.subtle" borderRadius="md" mb={3} mx={{ base: 'auto', md: '0' }} />
                <Flex gap={2} justify={{ base: 'center', md: 'flex-start' }}>
                  <Box w="80px" h="24px" bg="bg.subtle" borderRadius="full" />
                  <Box w="80px" h="24px" bg="bg.subtle" borderRadius="full" />
                  <Box w="80px" h="24px" bg="bg.subtle" borderRadius="full" />
                </Flex>
              </Box>
            </Flex>
          </Box>

          <Flex gap={2}>
            <Box w="100px" h="32px" bg="bg.subtle" borderRadius="lg" />
            <Box w="100px" h="32px" bg="bg.subtle" borderRadius="lg" />
            <Box w="100px" h="32px" bg="bg.subtle" borderRadius="lg" />
          </Flex>

          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Box key={i} h="300px" bg="bg.subtle" borderRadius="xl" borderWidth="1px" borderColor="border" />
            ))}
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
}
