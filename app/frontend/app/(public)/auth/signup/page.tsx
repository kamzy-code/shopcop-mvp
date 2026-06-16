'use client';

import { useState } from 'react';
import { Button, Center, Field, Flex, Heading, Input, Link, Stack, Text } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';
import { LuArrowRight, LuBuilding2, LuShoppingBag } from 'react-icons/lu';
import { useSignUp } from '@/app/_hooks/auth';
import { toaster } from '@/components/ui/toaster';
import { emailSchema } from '@/app/validators/authSchema';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/app/_types';

export default function SignupPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<'role' | 'email'>('role');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const cardBg = useColorModeValue('white', 'gray.900');

  function handleRoleSelect(selected: UserRole) {
    setRole(selected);
    setStep('email');
  }

  const signupMutation = useSignUp();

  const handleSignUp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!role) return;

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toaster.create({ title: emailResult.error.issues[0].message, type: 'error' });
      return;
    }

    try {
      const result = await signupMutation.mutateAsync({ role, email });

      toaster.create({
        title: 'Verification code sent',
        description: `A verification code has been sent to ${result.data.email}. Please check your email to complete the signup process.`,
        type: 'success',
      });
      router.push(`/auth/verify-otp?email=${encodeURIComponent(result.data.email)}`);
    } catch (error) {
      // Handle error (e.g., show error message)
      console.error('Signup failed:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toaster.create({ title: 'Signup failed', description: message, type: 'error' });
    }
  };

  if (step === 'email') {
    return (
      <Center minH="100dvh" bg="bg" px={4}>
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
          {/* Selected role badge */}
          <Flex
            align="center"
            gap={2}
            mb={6}
            alignSelf="flex-start"
            px={3}
            py={1.5}
            bg="primary.subtle"
            borderRadius="full"
          >
            {role === 'VENDOR' ? <LuBuilding2 size={14} /> : <LuShoppingBag size={14} />}
            <Text textStyle="xs" fontWeight="medium" color="primary.fg">
              Signing up as {role === 'VENDOR' ? 'a Vendor' : 'a Buyer'}
            </Text>
          </Flex>

          {/* Header */}
          <Stack gap={1} mb={8}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Create your account
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              Enter your email to receive a verification code.
            </Text>
          </Stack>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignUp(e);
            }}
          >
            <Stack gap={6}>
              <Field.Root required>
                <Field.Label color="fg">Email address</Field.Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  size="lg"
                  colorPalette="primary"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field.ErrorText />
              </Field.Root>

              <Button
                type="submit"
                colorPalette="primary"
                size="lg"
                w="full"
                loading={signupMutation.isPending}
                disabled={signupMutation.isPending}
              >
                Send verification code
                <LuArrowRight />
              </Button>
            </Stack>
          </form>

          {/* Back */}
          <Button variant="ghost" size="sm" mt={6} color="fg.muted" onClick={() => setStep('role')}>
            ← Back to role selection
          </Button>
        </Flex>
      </Center>
    );
  }

  return (
    <Center minH="100dvh" bg="bg" px={4}>
      <Flex
        direction="column"
        w="full"
        maxW="lg"
        px={{ base: 6, sm: 10 }}
        py={{ base: 8, sm: 12 }}
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border"
        borderRadius="2xl"
        shadow="lg"
      >
        {/* Header */}
        <Stack gap={1} mb={10}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Join ShopCop
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            Choose how you want to use ShopCop.
          </Text>
        </Stack>

        {/* Role cards */}
        <Stack gap={4}>
          <Flex
            as="button"
            data-disabled={true}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
              _hover: { borderColor: 'border' }, // suppress hover when disabled
              shadow: 'none',
            }}
            direction="column"
            align="flex-start"
            gap={3}
            p={5}
            borderWidth="2px"
            borderColor="border"
            borderRadius="xl"
            bg={cardBg}
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ borderColor: 'primary.500', shadow: 'sm' }}
            _focusVisible={{ borderColor: 'primary.500', shadow: 'outline' }}
            //onClick={() => handleRoleSelect('BUYER')}
          >
            <Flex
              w="10"
              h="10"
              align="center"
              justify="center"
              borderRadius="lg"
              bg="primary.subtle"
            >
              <LuShoppingBag size={20} />
            </Flex>
            <Stack gap={0.5} textAlign="left">
              <Text fontWeight="semibold" color="fg">
                {"I'm a Buyer"}
              </Text>
              <Text textStyle="sm" color="fg.muted">
                Browse products, compare prices, and shop smarter.
              </Text>
            </Stack>
          </Flex>

          <Flex
            as="button"
            direction="column"
            align="flex-start"
            gap={3}
            p={5}
            borderWidth="2px"
            borderColor="border"
            borderRadius="xl"
            bg={cardBg}
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ borderColor: 'primary.500', shadow: 'sm' }}
            _focusVisible={{ borderColor: 'primary.500', shadow: 'outline' }}
            onClick={() => handleRoleSelect('VENDOR')}
          >
            <Flex
              w="10"
              h="10"
              align="center"
              justify="center"
              borderRadius="lg"
              bg="primary.subtle"
            >
              <LuBuilding2 size={20} />
            </Flex>
            <Stack gap={0.5} textAlign="left">
              <Text fontWeight="semibold" color="fg">
                {"I'm a Vendor"}
              </Text>
              <Text textStyle="sm" color="fg.muted">
                List your products, manage inventory, and grow sales.
              </Text>
            </Stack>
          </Flex>
        </Stack>

        {/* Login link */}
        <Text mt={8} textStyle="sm" textAlign="center" color="fg.muted">
          Already have an account?{' '}
          <Link href="/auth/login" color="primary.fg" fontWeight="medium">
            Sign in
          </Link>
        </Text>
      </Flex>
    </Center>
  );
}
