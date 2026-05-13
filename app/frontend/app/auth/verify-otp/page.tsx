"use client"

import {
  Button,
  Center,
  Flex,
  Heading,
  Link,
  PinInput,
  Stack,
  Text,
} from "@chakra-ui/react"
import { LuArrowLeft, LuShield } from "react-icons/lu"

export default function VerifyOtpPage() {
  const email = "you@example.com"

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
            Enter the 6-digit code sent to{" "}
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
          onValueComplete={(details) => {
            console.log(details.valueAsString)
          }}
        >
          <PinInput.Control>
            {Array.from({ length: 6 }, (_, i) => (
              <PinInput.Input key={i} index={i} />
            ))}
          </PinInput.Control>
        </PinInput.Root>

        {/* Actions */}
        <Stack gap={4} mt={8} w="full">
          <Button colorPalette="primary" size="lg" w="full">
            Verify email
          </Button>

          <Text textStyle="sm" color="fg.muted">
            {"Didn't receive a code?"}
            <Link color="primary.fg" fontWeight="medium">
              Resend
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
  )
}
