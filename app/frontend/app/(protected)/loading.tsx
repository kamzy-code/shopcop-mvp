import { Box, Text } from '@chakra-ui/react';

export default function ProtectedLoading() {
  return (
    <Box textAlign="center" py={16}>
      <Box
        mx="auto"
        w={{ base: 10, sm: 12, md: 16 }}
        h={{ base: 10, sm: 12, md: 16 }}
        borderRadius="full"
        borderWidth="3px"
        borderColor="primary.500"
        borderTopColor="transparent"
        animation="spin 0.8s linear infinite"
        mb={4}
      />
      <Text color="fg.muted" textStyle={{ base: 'sm', sm: 'md' }}>
        Loading...
      </Text>
    </Box>
  );
}
