import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { LuArrowRight, LuShieldCheck } from 'react-icons/lu';

interface VerificationSuccessCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  /** When true, wraps the content in a standalone page card. */
  standalone?: boolean;
}

export function VerificationSuccessCard({
  title,
  description,
  actionLabel,
  onAction,
  standalone = false,
}: VerificationSuccessCardProps) {
  const content = (
    <Stack gap={6}>
      <Flex direction="column" align="center" gap={4} py={8}>
        <Flex
          w={16}
          h={16}
          borderRadius="full"
          bg="success.subtle"
          align="center"
          justify="center"
        >
          <LuShieldCheck size={32} color="var(--chakra-colors-success-600)" />
        </Flex>
        <Stack gap={1} textAlign="center">
          <Text fontWeight="semibold" color="fg" textStyle="lg">
            {title}
          </Text>
          <Text color="fg.muted" textStyle="sm">
            {description}
          </Text>
        </Stack>
      </Flex>
      <Button colorPalette="primary" size="lg" w="full" onClick={onAction}>
        {actionLabel}
        <LuArrowRight />
      </Button>
    </Stack>
  );

  if (!standalone) return content;

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      p={{ base: 6, sm: 8 }}
      shadow="lg"
    >
      {content}
    </Box>
  );
}
