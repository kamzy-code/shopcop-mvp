// components/ui/full-page-spinner.tsx
'use client';
import { Center, Spinner, Stack, Text } from '@chakra-ui/react';
interface FullPageSpinnerProps {
  message?: string;
}
export default function FullPageSpinner({ message }: FullPageSpinnerProps) {
  return (
    <Center minH="100dvh" bg="bg">
      <Stack align="center" gap={4}>
        <Spinner
          width={{ base: 10, sm: 12, md: 16 }}
          height={{ base: 10, sm: 12, md: 16 }}
          colorPalette="primary"
        />
        {message && (
          <Text color="fg.muted" textStyle={{ base: 'sm', sm: 'md' }}>
            {message}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
