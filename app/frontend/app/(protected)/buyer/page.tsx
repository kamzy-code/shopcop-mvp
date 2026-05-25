'use client';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { LuShoppingCart } from 'react-icons/lu';

export default function BuyerHomePage() {
  return (
    <Flex minH="100dvh" align="center" justify="center" bg="bg" p={6}>
      <Box textAlign="center" maxW="sm">
        <Flex
          w={16}
          h={16}
          borderRadius="2xl"
          bg="primary.subtle"
          align="center"
          justify="center"
          mx="auto"
          mb={6}
          color="primary.fg"
        >
          <LuShoppingCart size={28} />
        </Flex>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg" mb={2}>
          Buyer Home
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Buyer features are coming soon. Stay tuned!
        </Text>
      </Box>
    </Flex>
  );
}
