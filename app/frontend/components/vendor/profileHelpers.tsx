'use client';
import { Box, Flex, Text } from '@chakra-ui/react';

export function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      gap={{ base: 0.5, sm: 3 }}
      py={3}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottomWidth: 0 }}
    >
      <Text textStyle="sm" color="fg.muted" minW="160px" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color={value ? 'fg' : 'fg.subtle'} fontWeight={value ? 'medium' : 'normal'}>
        {value ?? '—'}
      </Text>
    </Flex>
  );
}

export function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <Text textStyle="sm" color="fg.subtle">—</Text>;
  return (
    <Flex flexWrap="wrap" gap={1.5}>
      {items.map((item) => (
        <Box
          key={item}
          px={2.5}
          py={0.5}
          borderRadius="full"
          bg="primary.subtle"
          color="primary.fg"
          textStyle="xs"
          fontWeight="medium"
        >
          {item}
        </Box>
      ))}
    </Flex>
  );
}
