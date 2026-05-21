import { Box, Text } from '@chakra-ui/react';

interface MutationErrorAlertProps {
  error: unknown;
  title?: string;
}

export function MutationErrorAlert({ error, title = 'Submission Failed' }: MutationErrorAlertProps) {
  if (!error) return null;
  const message =
    error instanceof Error ? error.message : 'An error occurred. Please try again.';
  return (
    <Box p={4} borderRadius="lg" bg="red.subtle" borderWidth="1px" borderColor="red.200">
      <Text textStyle="sm" color="red.600" fontWeight="medium">
        {title}
      </Text>
      <Text textStyle="xs" color="red.500" mt={1}>
        {message}
      </Text>
    </Box>
  );
}
