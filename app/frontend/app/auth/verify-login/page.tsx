"use client"

import { Button, Center, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react"
import { LuArrowLeft, LuMailCheck } from "react-icons/lu"

export default function VerifyLoginPage() {
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
          <LuMailCheck size={28} />
        </Flex>

        {/* Heading */}
        <Stack gap={2} mb={8}>
          <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg">
            Check your email
          </Heading>
          <Text color="fg.muted" textStyle="sm">
            We sent a magic link to{" "}
            <Text as="span" fontWeight="medium" color="fg">
              {email}
            </Text>
            . Click the link in the email to sign in.
          </Text>
        </Stack>

        {/* Actions */}
        <Stack gap={4} w="full">
          <Button
            colorPalette="primary"
            size="lg"
            w="full"
          >
            Open email app
          </Button>

          <Text textStyle="sm" color="fg.muted">
            {"Didn't receive the email?"}
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
  )
}
