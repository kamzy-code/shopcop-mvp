'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuStore } from 'react-icons/lu';
import { ColorModeButton } from '@/components/ui/color-mode';

export default function VerificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" minH="100dvh" bg="bg">
      {/* Header — matches onboarding layout */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        h="64px"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.panel"
        flexShrink={0}
      >
        <Flex align="center" gap={2.5}>
          <Flex
            w={8}
            h={8}
            borderRadius="lg"
            bg="primary.500"
            align="center"
            justify="center"
          >
            <LuStore size={16} color="white" />
          </Flex>
          <Text fontWeight="bold" textStyle="lg" color="fg">
            ShopCop
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Text textStyle="sm" color="fg.muted">
            Vendor Setup
          </Text>
          <ColorModeButton />
        </Flex>
      </Flex>

      {/* Page content */}
      <Box flex={1} overflow="auto">
        <Box py={{ base: 6, md: 10 }} px={{ base: 4, sm: 0 }}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
