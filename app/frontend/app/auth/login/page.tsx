"use client"

import { Button, Center, Field, Flex, Heading, Input, Link, Stack, Text } from "@chakra-ui/react"
import { LuArrowRight, LuMail } from "react-icons/lu"

export default function LoginPage() {
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
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <Stack gap={6}>
            <Field.Root required>
              <Field.Label color="fg">
                Email address
              </Field.Label>
              <Input
                type="email"
                placeholder="you@example.com"
                size="lg"
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
          By continuing, you agree to our{" "}
          <Link href="#" color="primary.fg">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" color="primary.fg">
            Privacy Policy
          </Link>
          .
        </Text>
      </Flex>
    </Center>
  )
}
