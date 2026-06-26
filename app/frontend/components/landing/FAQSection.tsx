'use client';
import { Box, Collapsible, Flex, Icon, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { Reveal } from './Reveal';
import { SectionEyebrow } from './SectionEyebrow';

const faqs = [
  {
    q: 'Is ShopCop really free?',
    a: 'Yes, completely free during beta. No credit card required. We\'re testing with early users and want your feedback to make the platform better.',
  },
  {
    q: 'How long does verification take?',
    a: 'Usually 24 hours. Upload your documents (government ID, address proof, business license) and we verify them. You get your badge the next day.',
  },
  {
    q: 'What documents do I need?',
    a: 'Government ID (NIN), proof of address (utility bill or similar), and business documentation (CAC/SMEDAN registration if you have one).',
  },
  {
    q: 'Can I delete my profile later?',
    a: 'Yes, you can deactivate your account anytime. Your verification data is deleted after 30 days.',
  },
  {
    q: 'Will this help me sell more?',
    a: 'Our early users report 2-3x faster sales because buyers trust the verified badge. Results depend on your product quality and pricing, but the trust signal alone makes a significant difference.',
  },
  {
    q: 'What if I get rejected during verification?',
    a: 'If a document is unclear, we\'ll ask you to resubmit. You can try again. Our goal is to help you succeed, not to block you.',
  },
  {
    q: 'Do I have to post my reviews publicly?',
    a: 'Yes, reviews are public on your profile. That\'s what builds trust. We moderate for spam and fake reviews to keep everything fair.',
  },
  {
    q: 'Can I update my information later?',
    a: 'Yes, you can update your profile anytime. If verification documents change, just resubmit them through your dashboard.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      borderWidth="1px"
      borderColor={open ? 'primary.300' : 'border'}
      borderRadius="lg"
      bg="bg.panel"
      overflow="hidden"
      transition="border-color 0.2s"
    >
      <Flex
        align="center"
        justify="space-between"
        px={5}
        py={4}
        cursor="pointer"
        onClick={() => setOpen(!open)}
        gap={4}
      >
        <Text textStyle="sm" fontWeight="semibold" color={open ? 'primary.fg' : 'fg'} flex={1}>
          {question}
        </Text>
        <Flex
          w={7}
          h={7}
          borderRadius="full"
          bg={open ? 'primary.500' : 'bg.subtle'}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon
            as={LuChevronDown}
            boxSize={4}
            color={open ? 'white' : 'fg.subtle'}
            transform={open ? 'rotate(180deg)' : 'rotate(0deg)'}
            transition="transform 0.2s"
          />
        </Flex>
      </Flex>
      <Collapsible.Root open={open}>
        <Collapsible.Content>
          <Box px={5} pb={4}>
            <Text textStyle="sm" color="fg.muted" lineHeight="1.6">
              {answer}
            </Text>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}

export function FAQSection() {
  return (
    <Box as="section" py={{ base: 12, md: 16 }} px={4} bg="bg.subtle" id="faq">
      <Flex direction="column" align="center" maxW="3xl" mx="auto" gap={8}>
        <Reveal>
          <Box textAlign="center">
            <SectionEyebrow label="FAQ" colorPalette="warning" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Frequently Asked Questions
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Everything you need to know about getting verified on ShopCop.
            </Text>
          </Box>
        </Reveal>

        <Reveal delay={0.1}>
          <Flex direction="column" gap={3} w="full">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </Flex>
        </Reveal>
      </Flex>
    </Box>
  );
}
