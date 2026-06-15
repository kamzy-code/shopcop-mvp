'use client';
import { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { LuExternalLink, LuLink } from 'react-icons/lu';

export function StoreLinkStrip({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://getshopcop.com';
  const profileUrl = `${origin}/v/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  return (
    <Box px={4} py={3} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex align="center" gap={2} flexWrap="wrap">
        <Box color="primary.fg" display="flex" alignItems="center" flexShrink={0}>
          <LuLink size={14} />
        </Box>
        <Text textStyle="xs" color="fg.muted" flexShrink={0}>
          Your store:
        </Text>
        <Text textStyle="xs" fontFamily="mono" color="fg" flex={1} truncate minW="0">
          {profileUrl}
        </Text>
        <Flex gap={2} flexShrink={0}>
          <Button size="xs" variant="outline" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <a href={`/v/${slug}`} target="_blank" rel="noopener noreferrer">
            <Button size="xs" colorPalette="primary" variant="outline">
              <LuExternalLink size={11} />
              View profile
            </Button>
          </a>
        </Flex>
      </Flex>
    </Box>
  );
}
