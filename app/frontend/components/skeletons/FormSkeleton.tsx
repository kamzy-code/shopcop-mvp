import { Box, Stack } from '@chakra-ui/react';

interface FormSkeletonProps {
  fields?: number;
  textarea?: boolean;
}

export function FormSkeleton({ fields = 4, textarea = false }: FormSkeletonProps) {
  return (
    <Stack gap={5}>
      {Array.from({ length: fields }).map((_, i) => (
        <Box key={i}>
          <Box w="80px" h={3} bg="bg.subtle" borderRadius="md" mb={2} />
          <Box w="full" h="40px" bg="bg.subtle" borderRadius="lg" />
        </Box>
      ))}
      {textarea && (
        <Box>
          <Box w="80px" h={3} bg="bg.subtle" borderRadius="md" mb={2} />
          <Box w="full" h="100px" bg="bg.subtle" borderRadius="lg" />
        </Box>
      )}
    </Stack>
  );
}
