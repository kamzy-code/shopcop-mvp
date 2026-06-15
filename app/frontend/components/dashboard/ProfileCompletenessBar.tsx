import { Box, Flex, Text } from '@chakra-ui/react';

export function ProfileCompletenessBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'primary';
  return (
    <Box>
      <Flex justify="space-between" mb={1}>
        <Text textStyle="xs" color="fg.muted">
          Profile completeness
        </Text>
        <Text textStyle="xs" fontWeight="semibold" color={`${color}.fg`}>
          {pct}%
        </Text>
      </Flex>
      <Box h="6px" borderRadius="full" bg="bg.subtle" overflow="hidden">
        <Box
          h="full"
          borderRadius="full"
          bg={`${color}.500`}
          w={`${pct}%`}
          transition="width 0.4s ease"
        />
      </Box>
    </Box>
  );
}
