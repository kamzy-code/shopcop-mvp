'use client';
import { useEffect } from 'react';
import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import {
  LuArrowRight,
  LuLayoutDashboard,
  LuPackage,
  LuShieldCheck,
  LuPartyPopper,
} from 'react-icons/lu';
import { useOnboardingStore } from '@/app/_store/onboardingStore';

export default function CompletePage() {
  const router = useRouter();
  const businessInfo = useOnboardingStore((s) => s.businessInfo);
  const reset = useOnboardingStore((s) => s.reset);

  // If someone lands here without completing steps, redirect them
  useEffect(() => {
    if (!businessInfo) {
      router.replace('/onboarding/business-info');
    }
  }, [businessInfo, router]);

  const handleGoToDashboard = () => {
    // reset();
    router.push('/dashboard');
  };

  const handleAddProduct = () => {
    // reset();
    router.push('/products/new');
  };

  if (!businessInfo) return null;

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      p={{ base: 6, sm: 8 }}
      shadow="lg"
      textAlign="center"
    >
      <Stack align="center" gap={6}>
        {/* Success icon */}
        <Box position="relative">
          <Flex
            w={20}
            h={20}
            borderRadius="full"
            bg="primary.subtle"
            align="center"
            justify="center"
            mx="auto"
          >
            <LuPartyPopper size={40} color="var(--chakra-colors-primary-600)" />
          </Flex>
          <Flex
            w={8}
            h={8}
            borderRadius="full"
            bg="success.500"
            align="center"
            justify="center"
            position="absolute"
            bottom={0}
            right={0}
          >
            <LuShieldCheck size={16} color="white" />
          </Flex>
        </Box>

        {/* Heading */}
        <Stack gap={2}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Profile Created! 🎉
          </Heading>
          <Text color="fg.muted" textStyle="sm" maxW="360px">
            Welcome to ShopCop,{' '}
            <Text as="span" fontWeight="semibold" color="fg">
              {businessInfo.businessName}
            </Text>
            ! Your vendor profile is now active. Start adding products to begin selling.
          </Text>
        </Stack>

        {/* Verification summary */}
        <Box
          w="full"
          p={4}
          borderRadius="xl"
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
        >
          <Text textStyle="sm" fontWeight="semibold" color="fg" mb={3} textAlign="left">
            Verification Status
          </Text>
          <Stack gap={2} textAlign="left">
            {[
              { label: 'Business Information', done: true },
              { label: 'BVN Verified', done: true },
              { label: 'NIN Verified', done: true },
            ].map((item) => (
              <Flex key={item.label} align="center" gap={3}>
                <Flex
                  w={5}
                  h={5}
                  borderRadius="full"
                  bg={item.done ? 'success.500' : 'bg.muted'}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  {item.done && <LuShieldCheck size={11} color="white" />}
                </Flex>
                <Text textStyle="sm" color={item.done ? 'fg' : 'fg.muted'}>
                  {item.label}
                </Text>
                {item.done && (
                  <Text textStyle="xs" color="success.fg" fontWeight="medium" ml="auto">
                    Verified
                  </Text>
                )}
              </Flex>
            ))}
          </Stack>
        </Box>

        {/* CTAs */}
        <Stack gap={3} w="full" pt={2}>
          <Button colorPalette="primary" size="lg" w="full" onClick={handleAddProduct}>
            <LuPackage />
            Add Your First Product
            <LuArrowRight />
          </Button>
          <Button variant="outline" size="lg" w="full" onClick={handleGoToDashboard}>
            <LuLayoutDashboard />
            Go to Dashboard
          </Button>
        </Stack>

        <Text textStyle="xs" color="fg.subtle">
          Your profile will be reviewed by our team within 24 hours to receive a verified badge.
        </Text>
      </Stack>
    </Box>
  );
}
