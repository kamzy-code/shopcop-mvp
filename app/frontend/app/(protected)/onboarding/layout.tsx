'use client';
import { Box, Center, Flex, Stack, Text } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { StepProgress } from '@/components/shared/stepProgress';
import { LuStore } from 'react-icons/lu';
import { ColorModeButton } from '@/components/ui/color-mode';
import { useProfileCompleteness } from '@/app/_hooks/vendor';

const STEPS = [
  { label: 'Personal Info', path: '/onboarding/personal-info' },
  { label: 'Business Info', path: '/onboarding/business-info' },
];

function getCurrentStep(pathname: string): number | null {
  if (pathname.includes('personal-info')) return 1;
  if (pathname.includes('business-info')) return 2;
  return null;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: completeness } = useProfileCompleteness();

  const isHub = pathname === '/onboarding' || pathname === '/onboarding/';
  const currentStep = getCurrentStep(pathname);
  const showStepper = !isHub && currentStep !== null;

  const isStepCompleted = (n: number): boolean => {
    if (!completeness) return false;
    if (n === 1) return completeness.sections.personal_info.completed;
    if (n === 2) return completeness.sections.business_info.completed;
    return false;
  };

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

      {/* Step progress — only on personal-info and business-info */}
      {showStepper && (
        <Box
          px={{ base: 4, sm: 6, md: 8 }}
          py={6}
          borderBottomWidth="1px"
          borderColor="border"
          bg="bg.panel"
        >
          <Box maxW="600px" mx="auto">
            <StepProgress
              steps={STEPS}
              currentStep={currentStep!}
              isStepCompleted={isStepCompleted}
            />
          </Box>
        </Box>
      )}

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
