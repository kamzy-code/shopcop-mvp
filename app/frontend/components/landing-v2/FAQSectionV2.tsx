'use client';
import { Box, Collapsible, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { LuChevronDown } from 'react-icons/lu';
import { Reveal } from '@/components/landing/Reveal';
import { SectionEyebrow } from '@/components/landing/SectionEyebrow';

const faqs = [
  {
    q: 'Will this replace my Instagram or WhatsApp shop?',
    a: 'No. ShopCop works underneath the platforms you already sell on. You keep posting and chatting exactly as you do now — your verified profile just travels with you into every conversation.',
  },
  {
    q: 'How long does verification take?',
    a: 'Usually under 24 hours. Upload your ID, address proof, and business documents, and we verify them — you get your badge the next day.',
  },
  {
    q: 'What documents do I need?',
    a: 'A government ID, proof of address, and business documentation if you have it (CAC/SMEDAN registration). We\'ll guide you through exactly what\'s required.',
  },
  {
    q: 'Is my customer data safe?',
    a: 'Yes. Verification documents are encrypted and only used to confirm your identity — they\'re never shared with buyers or third parties.',
  },
  {
    q: 'What does the tracking link actually do?',
    a: 'It gives your buyers a single link to check order status themselves, so you stop fielding "is my order coming?" messages one by one.',
  },
  {
    q: 'Is ShopCop free during beta?',
    a: 'Yes, completely free while we\'re in beta. No credit card required — we\'re prioritizing feedback from early vendors right now.',
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
      <Flex align="center" justify="space-between" px={5} py={4} cursor="pointer" onClick={() => setOpen(!open)} gap={4}>
        <Text textStyle="sm" fontWeight="semibold" color={open ? 'primary.fg' : 'fg'} flex={1}>
          {question}
        </Text>
        <Flex w={7} h={7} borderRadius="full" bg={open ? 'primary.500' : 'bg.subtle'} align="center" justify="center" flexShrink={0}>
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

export function FAQSectionV2() {
  return (
    <Box as="section" id="faq" py={{ base: 14, md: 20 }} px={4} bg="bg.subtle">
      <Box maxW="4xl" mx="auto">
        <Reveal>
          <Box textAlign="center" maxW="2xl" mx="auto" mb={10}>
            <SectionEyebrow label="Have Questions?" colorPalette="warning" />
            <Text fontWeight="extrabold" textStyle={{ base: '2xl', md: '3xl' }} color="fg" mb={3} letterSpacing="tight">
              Frequently asked questions
            </Text>
            <Text textStyle="sm" color="fg.muted">
              Clear answers to help you understand our verification process.
            </Text>
          </Box>
        </Reveal>

        <Reveal delay={0.1}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </SimpleGrid>
        </Reveal>
      </Box>
    </Box>
  );
}
