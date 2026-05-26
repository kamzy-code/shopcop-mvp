import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';

interface FormCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function FormCard({ icon, title, description, children }: FormCardProps) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      p={{ base: 6, sm: 8 }}
      shadow="lg"
      maxW="680px"
      mx="auto"
      w="full"
    >
      <Stack gap={1} mb={8}>
        <Flex
          w={10}
          h={10}
          borderRadius="xl"
          bg="primary.subtle"
          align="center"
          justify="center"
          mb={2}
        >
          {icon}
        </Flex>
        <Heading as="h1" textStyle="xl" fontWeight="bold" color="fg">
          {title}
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          {description}
        </Text>
      </Stack>
      {children}
    </Box>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      textStyle="md"
      fontWeight="semibold"
      color="primary.fg"
      pt={2}
    >
      {children}
    </Text>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Box pt={5}>
      <Text fontWeight="semibold" textStyle="md" color="primary.fg">
        {title}
      </Text>
      {description && (
        <Text textStyle="xs" color="fg.muted" mt={1}>
          {description}
        </Text>
      )}
    </Box>
  );
}
