'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Center, Flex, Heading, Link, PinInput, Stack, Text } from '@chakra-ui/react';
import { LuArrowLeft, LuCircleAlert, LuShield } from 'react-icons/lu';
import { useResendOTP, useVerifyAccounViaOTP, VerifyOTPResponse } from '@/app/_hooks/auth';
import { toaster } from '@/components/ui/toaster';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/app/_store/authStore';
import { ApiResponse } from '@/app/_types';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [otpResent, setOtpResent] = useState(false);
  const resendTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const verifyAccountMutation = useVerifyAccounViaOTP();
  const resendOTPMutation = useResendOTP();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    return () => clearTimeout(resendTimerRef.current);
  }, []);

  if (!email) {
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
              Email not found
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              Email is required for OTP verification. Please start the signup process again.
            </Text>
          </Stack>

          <Link
            color="primary.fg"
            fontWeight="medium"
            href="/auth/signup"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <LuArrowLeft />
            Back to sign up
          </Link>
        </Flex>
      </Center>
    );
  }

  const handleVerifyAccount = async () => {
    try {
      const result: ApiResponse<VerifyOTPResponse> = await verifyAccountMutation.mutateAsync({
        email,
        otp: otp.join(''),
      });
      setUser(result.data.user);
      setStatus('success');
    } catch (error) {
      console.error('OTP verification failed:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      // Show error message to the user (e.g., using a toast)
      toaster.create({ title: 'OTP Verification Failed', description: message, type: 'error' });
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTPMutation.mutateAsync({ email });
      toaster.create({
        title: 'OTP Resent',
        description: 'Check your email for a new OTP',
        type: 'success',
      });
      setOtpResent(true);
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      // Show error message to the user (e.g., using a toast)
      toaster.create({ title: 'Failed to resend OTP', description: message, type: 'error' });
    } finally {
      resendTimerRef.current = setTimeout(() => {
        setOtpResent(false);
      }, 1000 * 30);
    }
  };
  if (status === 'success') {
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
          {/* Icon */}
          <Flex
            w="16"
            h="16"
            align="center"
            justify="center"
            borderRadius="full"
            bg="primary.subtle"
            mb={6}
          >
            <LuShield size={28} />
          </Flex>

          {/* Heading */}
          <Stack gap={2} mb={8}>
            <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
              Email verified!
            </Heading>
            <Text color="fg.muted" textStyle="sm">
              Your email has been successfully verified. You can now sign in to your account.
            </Text>
          </Stack>

          {/* Actions */}
          <Stack gap={4} w="full">
            <Link href="/auth/login">
              <Button colorPalette="primary" size="lg" w="full">
                Go to login
              </Button>
            </Link>
          </Stack>
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
        {/* Icon */}
        <Flex
          w="16"
          h="16"
          align="center"
          justify="center"
          borderRadius="full"
          bg="primary.subtle"
          mb={6}
        >
          <LuShield size={28} />
        </Flex>

        {/* Heading */}
        <Stack gap={2} mb={8}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Verify your email
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            Enter the 6-digit code sent to{' '}
            <Text as="span" fontWeight="medium" color="fg">
              {email}
            </Text>
          </Text>
        </Stack>

        {/* OTP Input */}
        <PinInput.Root
          count={6}
          otp
          placeholder=""
          value={otp}
          onValueChange={(details) => {
            setOtp(details.value);
          }}
        >
          <PinInput.HiddenInput />
          <PinInput.Control>
            <PinInput.Input key={0} index={0} />
            <PinInput.Input key={1} index={1} />
            <PinInput.Input key={2} index={2} />
            <PinInput.Input key={3} index={3} />
            <PinInput.Input key={4} index={4} />
            <PinInput.Input key={5} index={5} />
          </PinInput.Control>
        </PinInput.Root>

        {/* Actions */}
        <Stack gap={4} mt={8} w="full">
          <Button
            colorPalette="primary"
            size="lg"
            w="full"
            disabled={otp.join('').length !== 6}
            loading={verifyAccountMutation.isPending}
            onClick={handleVerifyAccount}
          >
            Verify email
          </Button>

          <Text textStyle="sm" color="fg.muted">
            {"Didn't receive a code?"}
            <Link fontWeight="medium">
              <Button
                variant={'ghost'}
                color={'primary.fg'}
                onClick={handleResendOTP}
                disabled={otpResent || resendOTPMutation.isPending}
              >
                {resendOTPMutation.isPending ? 'Resending' : 'Resend'}
              </Button>
            </Link>
          </Text>
        </Stack>

        {/* Back link */}
        <Link
          mt={8}
          color="fg.muted"
          textStyle="sm"
          href="/auth/signup"
          display="inline-flex"
          alignItems="center"
          gap={1}
        >
          <LuArrowLeft />
          Back to sign up
        </Link>
      </Flex>
    </Center>
  );
}
