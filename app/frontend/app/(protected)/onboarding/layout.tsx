'use client';
import { Box, Center, Flex, Stack, Text } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { StepProgress } from '@/components/shared/stepProgress';
import { LuStore } from 'react-icons/lu';
import { ColorModeButton } from '@/components/ui/color-mode';

const STEPS = [
  { label: 'Personal Info', path: '/onboarding/personal-info' },
  { label: 'Business Info', path: '/onboarding/business-info' },
  { label: 'NIN Verify', path: '/onboarding/nin' },
  { label: 'Complete', path: '/onboarding/complete' },
];

function getCurrentStep(pathname: string): number {
  const index = STEPS.findIndex((s) => pathname.includes(s.path.split('/').pop()!));
  return index === -1 ? 1 : index + 1;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  return (
    <Flex direction="column" minH="100dvh" bg="bg">
      {/* Header */}
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

      {/* Step progress */}
      <Box
        px={{ base: 4, sm: 6, md: 8 }}
        py={6}
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.panel"
      >
        <Box maxW="600px" mx="auto">
          <StepProgress steps={STEPS} currentStep={currentStep} />
        </Box>
      </Box>

      {/* Page content */}
      <Box flex={1} overflow="auto">
        <Center py={{ base: 6, md: 10 }} px={{ base: 4, sm: 6 }}>
          <Stack w="full" maxW="560px" gap={0}>
            {children}
          </Stack>
        </Center>
      </Box>
    </Flex>
  );
}
