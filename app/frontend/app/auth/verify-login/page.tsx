'use client';

import { useVerifyLoginLink } from '@/app/_hooks/auth';
import { toaster } from '@/components/ui/toaster';
import { Button, Center, Flex, Heading, Link, Spinner, Stack, Text } from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { LuArrowLeft, LuCircleAlert, LuMailCheck } from 'react-icons/lu';
import { useAuthStore } from '@/app/_store/authStore';

export default function VerifyLoginPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const router = useRouter();
  const setUser = useAuthStore(s => s.setUser)

  const verifyLoginMutation = useVerifyLoginLink();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyLoginMutation
      .mutateAsync({ token })
      .then((result) => {
        if (cancelled) return;
        setUser(result.data.user)
        router.push(`/dashboard`);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toaster.create({ title: 'Login failed', description: message, type: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if ((!email && !token) || verifyLoginMutation.isError) {
    return (
      <Center minH="100dvh" bg="bg">
        <Flex
          direction="column"
          align="center"
          w="full"
          maxW="md"
          px={{ base: 6, sm: 10 }}
          py={{ base: 8, sm: 12 }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          borderRadius="2xl"
          shadow="lg"
          textAlign="center"
        >
          <Flex
            w="16"
            h="16"
            align="center"
            justify="center"
            borderRadius="full"
            bg="red.subtle"
            mb={6}
          >
            <LuCircleAlert size={28} />
          </Flex>

          <Stack gap={2} mb={8}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Invalid or expired link
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              This magic link is invalid or has expired. Please request a new one.
            </Text>
          </Stack>

          <Link
            color="primary.fg"
            fontWeight="medium"
            href="/auth/login"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <LuArrowLeft />
            Back to login
          </Link>
        </Flex>
      </Center>
    );
  }

  if (token) {
    return (
      <Center minH="100dvh" bg="bg">
        <Flex
          direction="column"
          align="center"
          w="full"
          maxW="md"
          px={{ base: 6, sm: 10 }}
          py={{ base: 8, sm: 12 }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          borderRadius="2xl"
          shadow="lg"
          textAlign="center"
        >
          <Spinner width={16} height={16} mb={6} colorPalette="primary" />

          <Stack gap={2} mb={8}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Verifying your login
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              Please wait while we verify your magic link...
            </Text>
          </Stack>

          {verifyLoginMutation.isPending && (
            <Text color="fg.subtle" textStyle="xs">
              This should only take a moment.
            </Text>
          )}
        </Flex>
      </Center>
    );
  }

  return (
    <Center minH="100dvh" bg="bg">
      <Flex
        direction="column"
        align="center"
        w="full"
        maxW="md"
        px={{ base: 6, sm: 10 }}
        py={{ base: 8, sm: 12 }}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        shadow="lg"
        textAlign="center"
      >
        <Flex
          w="16"
          h="16"
          align="center"
          justify="center"
          borderRadius="full"
          bg="primary.subtle"
          mb={6}
        >
          <LuMailCheck size={28} />
        </Flex>

        <Stack gap={2} mb={8}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Check your email
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            We sent a magic link to{' '}
            <Text as="span" fontWeight="medium" color="fg">
              {email}
            </Text>
            . Click the link in the email to sign in.
          </Text>
        </Stack>

        <Stack gap={4} w="full">
          <Button colorPalette="primary" size="lg" w="full">
            Open email app
          </Button>

          <Text textStyle="sm" color="fg.muted">
            {"Didn't receive the email?"}
            <Link color="primary.fg" fontWeight="medium">
              Resend
            </Link>
          </Text>
        </Stack>

        <Link
          mt={8}
          color="fg.muted"
          textStyle="sm"
          href="/auth/login"
          display="inline-flex"
          alignItems="center"
          gap={1}
        >
          <LuArrowLeft />
          Back to login
        </Link>
      </Flex>
    </Center>
  );
}
