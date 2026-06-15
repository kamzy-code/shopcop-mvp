import { Box, Center, Flex, Spinner, Stack, Text } from '@chakra-ui/react';

export default function TrackLoading() {
  return (
    <Center minH="100dvh" bg="bg">
      <Stack align="center" gap={6} w="full" maxW="600px" px={4}>
        <Spinner width={{ base: 10, sm: 12 }} height={{ base: 10, sm: 12 }} colorPalette="primary" />
        <Text color="fg.muted" textStyle="sm">Loading order details...</Text>
      </Stack>
    </Center>
  );
}
