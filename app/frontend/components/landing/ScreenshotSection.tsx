'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Reveal } from './Reveal';

export function ScreenshotSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4}>
      <Flex direction="column" align="center" maxW="4xl" mx="auto" gap={6}>
        <Reveal>
          <Box textAlign="center">
            <Text fontWeight="bold" textStyle="xl" color="fg" mb={2}>
              See it in action
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Your verified profile — at a glance.
            </Text>
          </Box>
        </Reveal>

        <Reveal delay={0.2} y={30}>
          <Flex
            w="full"
            aspectRatio={16 / 9}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border"
            bg="bg.subtle"
            align="center"
            justify="center"
            position="relative"
            overflow="hidden"
          >
            <DashboardMockup />
          </Flex>
        </Reveal>
      </Flex>
    </Box>
  );
}

function DashboardMockup() {
  return (
    <svg viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* Browser chrome */}
      <rect x="0" y="0" width="800" height="36" rx="4" fill="var(--chakra-colors-bg-emphasized, #2d3748)" />
      <circle cx="20" cy="18" r="6" fill="#ef4444" />
      <circle cx="40" cy="18" r="6" fill="#f59e0b" />
      <circle cx="60" cy="18" r="6" fill="#22c55e" />
      <rect x="140" y="12" width="180" height="12" rx="3" fill="var(--chakra-colors-bg-subtle, #4a5568)" />

      {/* Sidebar */}
      <rect x="0" y="36" width="200" height="414" fill="var(--chakra-colors-bg-panel, #1a202c)" />
      <rect x="16" y="60" width="36" height="36" rx="6" fill="var(--chakra-colors-primary-500, #319795)" />
      <rect x="60" y="72" width="56" height="8" rx="2" fill="var(--chakra-colors-fg, #e2e8f0)" opacity="0.7" />
      <rect x="60" y="84" width="36" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.4" />

      {/* Sidebar nav items */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="16" y={120 + i * 36} width="168" height="28" rx="4" fill={i === 0 ? 'var(--chakra-colors-primary-subtle, #234e52)' : 'transparent'} opacity="0.6" />
      ))}

      {/* Main content area */}
      <rect x="220" y="52" width="560" height="190" rx="8" fill="var(--chakra-colors-bg-panel, #1a202c)" />
      <rect x="240" y="72" width="200" height="10" rx="2" fill="var(--chakra-colors-fg, #e2e8f0)" opacity="0.5" />
      <rect x="240" y="90" width="140" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.3" />
      <rect x="240" y="112" width="520" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.2" />
      <rect x="240" y="124" width="480" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.2" />
      <rect x="240" y="148" width="160" height="60" rx="6" fill="var(--chakra-colors-primary-500, #319795)" opacity="0.8" />

      {/* Stats row */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={240 + i * 180} y={260} width="160" height="80" rx="6" fill="var(--chakra-colors-bg-panel, #1a202c)" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={260 + i * 180} y={276} width="80" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.3" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={260 + i * 180} y={290} width="40" height="8" rx="2" fill="var(--chakra-colors-primary-500, #319795)" opacity="0.5" />
      ))}

      {/* Bottom table */}
      <rect x="240" y="360" width="560" height="70" rx="6" fill="var(--chakra-colors-bg-panel, #1a202c)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={260 + i * 130} y={376} width="110" height="6" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.15 + (i % 2) * 0.1" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={260} y={396 + i * 10} width={560 - i * 100} height="4" rx="2" fill="var(--chakra-colors-fg-subtle, #718096)" opacity="0.08" />
      ))}
    </svg>
  );
}
