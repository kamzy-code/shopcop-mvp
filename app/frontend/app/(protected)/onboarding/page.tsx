'use client';
import { Box, Center, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import {
  LuArrowRight,
  LuBuilding2,
  LuCheck,
  LuChevronRight,
  LuShieldCheck,
  LuUser,
} from 'react-icons/lu';
import { useProfileCompleteness } from '@/app/_hooks/vendor';

export default function OnboardingHubPage() {
  const { data: completeness } = useProfileCompleteness();

  if (!completeness) {
    return (
      <Center py={20}>
        <Spinner color="primary.500" size="lg" />
      </Center>
    );
  }

  const personalDone = completeness.sections.personal_info.completed;
  const businessDone = completeness.sections.business_info.completed;
  const allDone = personalDone && businessDone;

  const profilePct = [personalDone, businessDone].filter(Boolean).length * 50;
  const progressColor = allDone ? 'success' : profilePct >= 50 ? 'warning' : 'primary';

  const nextStepKey = !personalDone ? 'personal_info' : !businessDone ? 'business_info' : null;

  const SETUP_STEPS = [
    {
      key: 'personal_info',
      label: 'Personal Information',
      description: 'Your name, gender, date of birth, and phone number.',
      icon: LuUser,
      href: '/onboarding/personal-info',
      isCompleted: personalDone,
    },
    {
      key: 'business_info',
      label: 'Business Information',
      description: 'Business name, location, category, banking, and refund policy.',
      icon: LuBuilding2,
      href: '/onboarding/business-info',
      isCompleted: businessDone,
    },
  ] as const;

  return (
    <Stack w="full" gap={8} py={2}>
      {/* Heading */}
      <Stack gap={1}>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
          Set Up Your Vendor Profile
        </Heading>
        <Text color="fg.muted" textStyle="sm">
          Complete these steps to activate your account and start selling.
        </Text>
      </Stack>

      {/* Progress bar */}
      <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
        <Flex justify="space-between" mb={2}>
          <Text textStyle="sm" fontWeight="semibold" color="fg">
            Setup Progress
          </Text>
          <Text textStyle="sm" fontWeight="bold" color={`${progressColor}.fg`}>
            {profilePct}%
          </Text>
        </Flex>
        <Box h="8px" borderRadius="full" bg="bg.subtle" overflow="hidden">
          <Box
            h="full"
            borderRadius="full"
            bg={`${progressColor}.500`}
            w={`${profilePct}%`}
            transition="width 0.4s ease"
          />
        </Box>
        {allDone && (
          <Flex align="center" gap={1.5} mt={2.5}>
            <LuShieldCheck size={13} color="var(--chakra-colors-success-600)" />
            <Text textStyle="xs" color="success.fg">
              Profile complete — complete identity verification to unlock higher tiers
            </Text>
          </Flex>
        )}
      </Box>

      {/* Step cards */}
      <Stack gap={3}>
        {SETUP_STEPS.map((step) => {
          const isNext = step.key === nextStepKey;
          return (
            <NextLink key={step.key} href={step.href} style={{ textDecoration: 'none' }}>
              <Flex
                p={5}
                bg="bg.panel"
                borderWidth="1.5px"
                borderColor={step.isCompleted ? 'success.200' : isNext ? 'primary.200' : 'border'}
                borderRadius="xl"
                align="center"
                gap={4}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{
                  borderColor: step.isCompleted ? 'success.300' : 'primary.300',
                  shadow: 'sm',
                }}
              >
                {/* Icon */}
                <Flex
                  w={11}
                  h={11}
                  borderRadius="lg"
                  flexShrink={0}
                  bg={step.isCompleted ? 'success.subtle' : 'primary.subtle'}
                  align="center"
                  justify="center"
                  color={step.isCompleted ? 'success.fg' : 'primary.fg'}
                >
                  <step.icon size={20} />
                </Flex>

                {/* Text */}
                <Box flex={1}>
                  <Text fontWeight="semibold" color="fg" textStyle="sm">
                    {step.label}
                  </Text>
                  <Text color="fg.muted" textStyle="xs" mt={0.5}>
                    {step.description}
                  </Text>
                </Box>

                {/* Status */}
                {step.isCompleted ? (
                  <Flex
                    align="center"
                    gap={1.5}
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    bg="success.subtle"
                    flexShrink={0}
                  >
                    <LuCheck size={12} color="var(--chakra-colors-success-600)" />
                    <Text textStyle="xs" fontWeight="medium" color="success.fg">
                      Done
                    </Text>
                  </Flex>
                ) : (
                  <Flex align="center" gap={0.5} color="fg.subtle" flexShrink={0}>
                    <Text textStyle="xs" color={isNext ? 'primary.fg' : 'fg.subtle'} fontWeight={isNext ? 'medium' : 'normal'}>
                      {isNext ? 'Start' : 'Edit'}
                    </Text>
                    <LuChevronRight size={15} color={isNext ? 'var(--chakra-colors-primary-600)' : undefined} />
                  </Flex>
                )}
              </Flex>
            </NextLink>
          );
        })}
      </Stack>

      {/* Verifications CTA — shown when both profile steps are done */}
      {allDone && (
        <Box
          p={5}
          bg="primary.subtle"
          borderWidth="1.5px"
          borderColor="primary.200"
          borderRadius="xl"
        >
          <Flex align="flex-start" gap={4} flexWrap="wrap">
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg="primary.500"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LuShieldCheck size={18} color="white" />
            </Flex>
            <Box flex={1} minW="180px">
              <Text fontWeight="semibold" color="primary.fg" textStyle="sm">
                Profile complete — get verified
              </Text>
              <Text color="primary.fg" textStyle="xs" opacity={0.85} mt={0.5}>
                Submit your NIN, address proof, and business registration to increase your tier and build buyer trust.
              </Text>
            </Box>
            <NextLink href="/verifications" style={{ flexShrink: 0 }}>
              <Flex
                align="center"
                gap={1.5}
                px={4}
                py={2}
                bg="primary.500"
                color="white"
                borderRadius="lg"
                cursor="pointer"
                transition="opacity 0.15s"
                _hover={{ opacity: 0.88 }}
              >
                <Text textStyle="sm" fontWeight="semibold">
                  Go to Verifications
                </Text>
                <LuArrowRight size={15} />
              </Flex>
            </NextLink>
          </Flex>
        </Box>
      )}
    </Stack>
  );
}
