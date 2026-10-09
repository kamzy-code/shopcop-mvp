'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LuArrowRight, LuCheck, LuClock, LuShoppingBag, LuStore } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '@/components/landing/Reveal';
import { useJoinWaitlist } from '@/app/_hooks/waitlist';
import { waitlistSchema } from '@/app/validators/waitlistSchema';
import { WaitlistUserType } from '@/app/_types';

const m = motion;

// ─── Challenge options ────────────────────────────────────────────────────────

const BUYER_CHALLENGES = [
  'Finding trustworthy vendors',
  'Knowing if a vendor is legitimate',
  'Poor product/service quality',
  'Delivery issues',
  'Getting value for my money',
  'Poor customer service',
];

const SELLER_CHALLENGES = [
  'Getting customers',
  'Building trust with customers',
  'Standing out from competitors',
  'Managing orders/payments',
  'Delivery/logistics',
  'Getting repeat customers',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleButton({
  selected,
  onClick,
  icon,
  label,
  sublabel,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <Box
      flex={1}
      px={5}
      py={4}
      borderRadius="xl"
      borderWidth="2px"
      borderColor={selected ? 'primary.500' : 'border'}
      bg={selected ? 'primary.subtle' : 'bg.panel'}
      transition="all 0.15s"
      _hover={{ borderColor: 'primary.400', bg: selected ? 'primary.subtle' : 'bg.subtle' }}
      cursor="pointer"
      onClick={onClick}
    >
      <Flex align="center" gap={3}>
        <Flex
          w={10}
          h={10}
          align="center"
          justify="center"
          borderRadius="lg"
          bg={selected ? 'primary.500' : 'bg.muted'}
          color={selected ? 'white' : 'fg.muted'}
          transition="all 0.15s"
          flexShrink={0}
        >
          {icon}
        </Flex>
        <Box>
          <Text fontWeight="semibold" color="fg" textStyle="sm">{label}</Text>
          <Text textStyle="xs" color="fg.muted">{sublabel}</Text>
        </Box>
        {selected && (
          <Box ml="auto" color="primary.500" flexShrink={0}>
            <LuCheck size={18} />
          </Box>
        )}
      </Flex>
    </Box>
  );
}

function ChallengeOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <Box
      as="label"
      display="flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      borderRadius="lg"
      borderWidth="1.5px"
      borderColor={checked ? 'primary.500' : 'border'}
      bg={checked ? 'primary.subtle' : 'bg.panel'}
      cursor="pointer"
      transition="all 0.12s"
      _hover={{ borderColor: 'primary.400' }}
    >
      <Box
        w={5}
        h={5}
        borderRadius="md"
        borderWidth="1.5px"
        borderColor={checked ? 'primary.500' : 'border.muted'}
        bg={checked ? 'primary.500' : 'transparent'}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        transition="all 0.12s"
      >
        {checked && <LuCheck size={12} color="white" />}
      </Box>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
      />
      <Text textStyle="sm" color="fg" fontWeight={checked ? 'medium' : 'normal'}>{label}</Text>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<WaitlistUserType | null>(null);
  const [tradeDetails, setTradeDetails] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [customChallenge, setCustomChallenge] = useState('');
  const [openToChat, setOpenToChat] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<null | boolean>(null);

  const waitlistMutation = useJoinWaitlist();

  const builtInChallenges = userType === 'BUY' ? BUYER_CHALLENGES : userType === 'SELL' ? SELLER_CHALLENGES : [];
  const customChallenges = challenges.filter((c) => !builtInChallenges.includes(c));

  function toggleChallenge(option: string) {
    setChallenges((prev) =>
      prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option]
    );
  }

  function addCustomChallenge() {
    const trimmed = customChallenge.trim();
    if (!trimmed || challenges.includes(trimmed) || challenges.length >= 10) return;
    setChallenges((prev) => [...prev, trimmed]);
    setCustomChallenge('');
  }

  function handleRoleChange(type: WaitlistUserType) {
    setUserType(type);
    setChallenges([]);
    setFieldErrors((prev) => ({ ...prev, user_type: '' }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userType) {
      setFieldErrors({ user_type: 'Please select whether you buy or sell' });
      return;
    }

    const parsed = waitlistSchema.safeParse({
      email: email.trim(),
      phone: phone.trim(),
      user_type: userType,
      trade_details: tradeDetails.trim(),
      challenges,
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
      setSubmitted(result.data.open_to_chat);
    } catch (error) {
      setFieldErrors({
        form: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    }
  }

  // ─── Success state ──────────────────────────────────────────────────────────

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
            <Flex w="14" h="14" mx="auto" mb={6} align="center" justify="center" borderRadius="full" bg="primary.500" color="white">
              <LuCheck size={28} />
            </Flex>
            <Heading as="h2" color="white" fontWeight="extrabold" letterSpacing="tight" lineHeight="1.2">
              You&apos;re on the waitlist
            </Heading>
            <Text color="navy.200" mt={4}>
              We&apos;ll email you when ShopCop opens up.
            </Text>
            {submitted && (
              <Flex mt={8} p={5} gap={3} textAlign="left" borderRadius="xl" bg="whiteAlpha.200" borderWidth="1px" borderColor="whiteAlpha.300">
                <Box color="primary.300" mt={0.5}>
                  <LuClock size={20} />
                </Box>
                <Box>
                  <Text color="white" fontWeight="semibold">Thanks for offering your time.</Text>
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

  // ─── Form ───────────────────────────────────────────────────────────────────

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
              <Stack gap={6}>
                {/* Contact */}
                <Stack gap={4}>
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
                </Stack>

                {/* Divider */}
                <Box borderTopWidth="1px" borderColor="border" />

                {/* Role */}
                <Field.Root required invalid={!!fieldErrors.user_type}>
                  <Field.Label color="fg" textStyle="sm" fontWeight="semibold">
                    Are you here to buy or sell?
                  </Field.Label>
                  <Flex gap={3} mt={1} direction={{ base: 'column', sm: 'row' }}>
                    <RoleButton
                      selected={userType === 'BUY'}
                      onClick={() => handleRoleChange('BUY')}
                      icon={<LuShoppingBag size={20} />}
                      label="I buy"
                      sublabel="I want to shop on ShopCop"
                    />
                    <RoleButton
                      selected={userType === 'SELL'}
                      onClick={() => handleRoleChange('SELL')}
                      icon={<LuStore size={20} />}
                      label="I sell"
                      sublabel="I want to sell on ShopCop"
                    />
                  </Flex>
                  <Field.ErrorText>{fieldErrors.user_type}</Field.ErrorText>
                </Field.Root>

                {/* What do you trade */}
                <Field.Root required invalid={!!fieldErrors.trade_details}>
                  <Field.Label color="fg">
                    {userType === 'SELL' ? 'What do you sell?' : 'What do you usually buy?'}
                  </Field.Label>
                  <Input
                    placeholder={
                      userType === 'SELL'
                        ? 'e.g. Ankara prints, phone accessories, ready-made dresses'
                        : 'e.g. Electronics, fashion, groceries'
                    }
                    size="lg"
                    colorPalette="primary"
                    value={tradeDetails}
                    onChange={(e) => setTradeDetails(e.target.value)}
                    maxLength={500}
                  />
                  <Field.ErrorText>{fieldErrors.trade_details}</Field.ErrorText>
                </Field.Root>

                {/* Challenges — only shown after role is picked */}
                <AnimatePresence>
                  {userType && (
                    <m.div
                      key="challenges"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Field.Root>
                        <Field.Label color="fg">
                          What&apos;s your biggest challenge when{' '}
                          {userType === 'BUY' ? 'buying' : 'selling'} online?{' '}
                          <Text as="span" color="fg.muted" fontWeight="normal">(pick all that apply)</Text>
                        </Field.Label>
                        <Stack gap={2} mt={2}>
                          {builtInChallenges.map((option) => (
                            <ChallengeOption
                              key={option}
                              label={option}
                              checked={challenges.includes(option)}
                              onChange={() => toggleChallenge(option)}
                            />
                          ))}

                          {/* Custom entries added via "Other" */}
                          {customChallenges.map((custom) => (
                            <Flex key={custom} align="center" gap={2}>
                              <Box flex={1}>
                                <ChallengeOption
                                  label={custom}
                                  checked
                                  onChange={() => toggleChallenge(custom)}
                                />
                              </Box>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                color="fg.muted"
                                onClick={() => setChallenges((prev) => prev.filter((c) => c !== custom))}
                                aria-label="Remove"
                                px={2}
                              >
                                ×
                              </Button>
                            </Flex>
                          ))}
                        </Stack>

                        {/* Add custom "Other" */}
                        {challenges.length < 10 && (
                          <Flex gap={2} mt={3}>
                            <Input
                              value={customChallenge}
                              onChange={(e) => setCustomChallenge(e.target.value)}
                              placeholder="Other — describe your challenge..."
                              size="md"
                              colorPalette="primary"
                              maxLength={200}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addCustomChallenge(); }
                              }}
                            />
                            <Button
                              type="button"
                              colorPalette="primary"
                              variant="outline"
                              size="md"
                              flexShrink={0}
                              disabled={!customChallenge.trim()}
                              onClick={addCustomChallenge}
                            >
                              Add
                            </Button>
                          </Flex>
                        )}
                      </Field.Root>
                    </m.div>
                  )}
                </AnimatePresence>

                {/* Divider */}
                <Box borderTopWidth="1px" borderColor="border" />

                {/* Chat opt-in */}
                <Box
                  as="label"
                  display="flex"
                  alignItems="flex-start"
                  gap={3}
                  px={4}
                  py={4}
                  borderRadius="xl"
                  borderWidth="1.5px"
                  borderColor={openToChat ? 'primary.500' : 'border'}
                  bg={openToChat ? 'primary.subtle' : 'bg.subtle'}
                  cursor="pointer"
                  transition="all 0.15s"
                  _hover={{ borderColor: 'primary.400' }}
                >
                  <Box
                    w={5}
                    h={5}
                    mt={0.5}
                    borderRadius="md"
                    borderWidth="1.5px"
                    borderColor={openToChat ? 'primary.500' : 'border.muted'}
                    bg={openToChat ? 'primary.500' : 'transparent'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    transition="all 0.12s"
                  >
                    {openToChat && <LuCheck size={12} color="white" />}
                  </Box>
                  <input
                    type="checkbox"
                    checked={openToChat}
                    onChange={(e) => setOpenToChat(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    tabIndex={-1}
                  />
                  <Box>
                    <Text fontWeight="semibold" color="fg" textStyle="sm">
                      I&apos;m open to a 20 minute chat about my experience.
                    </Text>
                    <Text color="fg.muted" textStyle="xs" mt={0.5}>
                      Someone from our team will reach out on WhatsApp within 2 days.
                    </Text>
                  </Box>
                </Box>

                {fieldErrors.form && (
                  <Text color="red.500" textStyle="sm">{fieldErrors.form}</Text>
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
