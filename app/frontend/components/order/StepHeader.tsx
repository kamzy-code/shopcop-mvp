import { Box, Flex, Stack, Text } from '@chakra-ui/react';

const STEPS = ['Order Items', 'Delivery Details', 'Review & Submit'];

export function StepHeader({ step, total }: { step: number; total: number }) {
  return (
    <Stack gap={2} mb={6}>
      <Flex gap={1}>
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            flex={1}
            h={1.5}
            borderRadius="full"
            bg={i <= step ? 'primary.500' : 'bg.subtle'}
            transition="background 0.2s"
          />
        ))}
      </Flex>
      <Text textStyle="xs" color="fg.muted">
        Step {step + 1} of {total} — {STEPS[step]}
      </Text>
    </Stack>
  );
}
