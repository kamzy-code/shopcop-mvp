import { Flex, Text } from '@chakra-ui/react';

interface InfoRowProps {
  label: string;
  value?: string | null | number | boolean;
}

export function InfoRow({ label, value }: InfoRowProps) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <Flex gap={3}>
      <Text textStyle="sm" color="fg.muted" w="44" flexShrink={0}>
        {label}
      </Text>
      <Text textStyle="sm" color="fg" fontWeight="medium" minW={0} wordBreak="break-word">
        {display}
      </Text>
    </Flex>
  );
}
