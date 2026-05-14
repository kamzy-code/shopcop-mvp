'use client';

import { useLogiWithMagicLink } from '@/app/_hooks/auth';
import { toaster } from '@/components/ui/toaster';
import { emailSchema } from '@/app/validators/authSchema';
import { Button, Center, Field, Flex, Heading, Input, Link, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LuArrowRight, LuMail } from 'react-icons/lu';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const loginMutation = useLogiWithMagicLink();
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toaster.create({ title: emailResult.error.issues[0].message, type: 'error' });
      return;
    }

    try {
      await loginMutation.mutateAsync({ email });
      router.push(`/auth/verify-login?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toaster.create({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error',
      });
      console.error('Login failed:', error);
      // Optionally, show an error message to the user
    }
  };
  return (
    <Center minH="100dvh" bg="bg">
      <Flex
        direction="column"
        w="full"
        maxW="md"
        px={{ base: 6, sm: 10 }}
        py={{ base: 8, sm: 12 }}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        shadow="lg"
      >
        {/* Brand */}
        <Stack gap={1} mb={10}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            ShopCop
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            Sign in to your account
          </Text>
        </Stack>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack gap={6}>
            <Field.Root required>
              <Field.Label color="fg">Email address</Field.Label>
              <Input
                type="email"
                placeholder="you@example.com"
                size="lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                colorPalette="primary"
                autoComplete="email"
                autoFocus
              />
              <Field.HelperText color="fg.subtle" textStyle="xs">
                {"We'll send you a magic link to sign in instantly."}
              </Field.HelperText>
              <Field.ErrorText />
            </Field.Root>

            <Button
              type="submit"
              disabled={!email || loginMutation.isPending}
              loading={loginMutation.isPending}
              colorPalette="primary"
              size="lg"
              w="full"
            >
              <LuMail />
              Send Magic Link
              <LuArrowRight />
            </Button>
          </Stack>
        </form>

        {/* Footer */}
        <Text mt={8} textStyle="xs" textAlign="center" color="fg.subtle">
          By continuing, you agree to our{' '}
          <Link href="#" color="primary.fg">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="#" color="primary.fg">
            Privacy Policy
          </Link>
          .
        </Text>
      </Flex>
    </Center>
  );
}
