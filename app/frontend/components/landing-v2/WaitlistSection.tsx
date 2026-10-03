'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { LuArrowRight, LuCheck, LuClock } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/landing/Reveal';
import { useJoinWaitlist } from '@/app/_hooks/waitlist';
import { waitlistSchema } from '@/app/validators/waitlistSchema';
import { WaitlistUserType } from '@/app/_types';

const m = motion;

const USER_TYPE_OPTIONS: { value: WaitlistUserType; label: string }[] = [
  { value: 'BUY', label: 'Mostly buy' },
  { value: 'SELL', label: 'Mostly sell' },
  { value: 'BOTH', label: 'Both' },
];

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<WaitlistUserType | null>(null);
  const [tradeDetails, setTradeDetails] = useState('');
  const [openToChat, setOpenToChat] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<null | boolean>(null);

  const waitlistMutation = useJoinWaitlist();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userType) {
      setFieldErrors({ user_type: 'Please select whether you mostly buy, sell, or both' });
      return;
    }

    const parsed = waitlistSchema.safeParse({
      email: email.trim(),
      phone: phone.trim(),
      user_type: userType,
      trade_details: tradeDetails.trim(),
      open_to_chat: openToChat,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const result = await waitlistMutation.mutateAsync(parsed.data);
      // The server echoes back the stored opt-in so the promise we make about
      // a 2 day follow-up always matches what was actually saved.
      setSubmitted(result.data.open_to_chat);
    } catch (error) {
      setFieldErrors({
        form: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  if (submitted !== null) {
    return (
      <Box
        as="section"
        id="waitlist"
        bg="primary.900"
        py={{ base: 16, md: 20 }}
        px={4}
        scrollMarginTop={{ base: 72, md: 88 }}
      >
        <Box
          position="absolute"
          inset={0}
          style={{
            backgroundImage: 'url(/pattern_overlay.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Reveal y={30}>
          <Box maxW="xl" mx="auto" textAlign="center" position="relative" zIndex={1}>
            <Flex
              w="14"
              h="14"
              mx="auto"
              mb={6}
              align="center"
              justify="center"
              borderRadius="full"
              bg="primary.500"
              color="white"
            >
              <LuCheck size={28} />
            </Flex>

            <Heading as="h2" color="white" fontWeight="extrabold" letterSpacing="tight" lineHeight="1.2">
              You&apos;re on the waitlist
            </Heading>

            <Text color="navy.200" mt={4}>
              We&apos;ll email you when ShopCop opens up.
            </Text>

            {submitted && (
              <Flex
                mt={8}
                p={5}
                gap={3}
                textAlign="left"
                borderRadius="xl"
                bg="whiteAlpha.200"
                borderWidth="1px"
                borderColor="whiteAlpha.300"
              >
                <Box color="primary.300" mt={0.5}>
                  <LuClock size={20} />
                </Box>
                <Box>
                  <Text color="white" fontWeight="semibold">
                    Thanks for offering your time.
                  </Text>
                  <Text color="navy.200" textStyle="sm" mt={1}>
                    Because you ticked the chat box, someone from the team will reach out on WhatsApp
                    within 2 days for a quick 20 minute conversation about your experience.
                  </Text>
                </Box>
              </Flex>
            )}
          </Box>
        </Reveal>
      </Box>
    );
  }

  return (
    <Box
      as="section"
      id="waitlist"
      position="relative"
      overflow="hidden"
      bg="primary.900"
      py={{ base: 16, md: 20 }}
      px={4}
      scrollMarginTop={{ base: 72, md: 88 }}
    >
      <Box
        position="absolute"
        inset={0}
        opacity={1}
        zIndex={0}
        style={{
          backgroundImage: 'url(/pattern_overlay.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Reveal y={30}>
        <Box maxW="2xl" mx="auto" position="relative" zIndex={1}>
          <Stack gap={3} textAlign="center" mb={10}>
            <Heading
              as="h2"
              color="white"
              fontWeight="extrabold"
              textStyle={{ base: '2xl', md: '4xl' }}
              letterSpacing="tight"
              lineHeight="1.2"
            >
              Join the waitlist
            </Heading>
            <Text color="navy.200">
              We&apos;re opening up in small batches. Tell us a little about how you buy and sell,
              and we&apos;ll invite you when your spot opens.
            </Text>
          </Stack>

          <Box
            asChild
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="2xl"
            shadow="lg"
            p={{ base: 6, sm: 8 }}
          >
            <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Field.Root required invalid={!!fieldErrors.email}>
                <Field.Label color="fg">Email address</Field.Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  size="lg"
                  colorPalette="primary"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field.ErrorText>{fieldErrors.email}</Field.ErrorText>
              </Field.Root>

              <Field.Root required invalid={!!fieldErrors.phone}>
                <Field.Label color="fg">WhatsApp number</Field.Label>
                <Input
                  type="tel"
                  placeholder="0803 123 4567"
                  size="lg"
                  colorPalette="primary"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Field.HelperText>We&apos;ll only use this for your invite.</Field.HelperText>
                <Field.ErrorText>{fieldErrors.phone}</Field.ErrorText>
              </Field.Root>

              <Field.Root required invalid={!!fieldErrors.user_type}>
                <Field.Label color="fg">Do you mostly buy, sell, or both?</Field.Label>
                <Flex gap={3} mt={1} direction={{ base: 'column', sm: 'row' }}>
                  {USER_TYPE_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      flex={1}
                      variant={userType === option.value ? 'solid' : 'outline'}
                      colorPalette={userType === option.value ? 'primary' : 'gray'}
                      size="lg"
                      onClick={() => {
                        setUserType(option.value);
                        setFieldErrors((prev) => ({ ...prev, user_type: '' }));
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Flex>
                <Field.ErrorText>{fieldErrors.user_type}</Field.ErrorText>
              </Field.Root>

              <Field.Root required invalid={!!fieldErrors.trade_details}>
                <Field.Label color="fg">What do you buy or sell?</Field.Label>
                <Textarea
                  placeholder="e.g. Ankara prints and ready-made dresses, plus phone accessories"
                  autoresize
                  rows={3}
                  maxLength={500}
                  value={tradeDetails}
                  onChange={(e) => setTradeDetails(e.target.value)}
                />
                <Field.ErrorText>{fieldErrors.trade_details}</Field.ErrorText>
              </Field.Root>

              <Checkbox.Root
                checked={openToChat}
                onCheckedChange={(details) => setOpenToChat(!!details.checked)}
                colorPalette="primary"
                alignItems="flex-start"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control mt={0.5}>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label color="fg" textStyle="sm">
                  I&apos;m open to a 20 minute chat about my experience.
                </Checkbox.Label>
              </Checkbox.Root>

              {fieldErrors.form && (
                <Text color="red.500" textStyle="sm">
                  {fieldErrors.form}
                </Text>
              )}

              <m.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  colorPalette="primary"
                  size="lg"
                  w="full"
                  loading={waitlistMutation.isPending}
                  disabled={waitlistMutation.isPending}
                >
                  Join the waitlist
                  <LuArrowRight />
                </Button>
              </m.div>

              <Text color="fg.muted" textStyle="xs" textAlign="center">
                No spam. We&apos;ll only email you about your invite.
              </Text>
            </Stack>
            </form>
          </Box>
        </Box>
      </Reveal>
    </Box>
  );
}