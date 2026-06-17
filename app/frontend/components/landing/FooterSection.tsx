import { Box, Flex, Text } from '@chakra-ui/react';

export function FooterSection() {
  return (
    <Box as="footer" py={6} px={4} borderTopWidth="1px" borderColor="border" bg="bg.panel">
      <Flex direction="column" align="center" textAlign="center" gap={1}>
        <Text textStyle="xs" color="fg.subtle">
          &copy; 2026 ShopCop — Verified sellers, trusted buyers.
        </Text>
      </Flex>
    </Box>
  );
}
