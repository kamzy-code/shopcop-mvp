'use client';
import { Flex, Text } from '@chakra-ui/react';
import { Reveal } from './Reveal';

interface SectionEyebrowProps {
  label: string;
  colorPalette?: 'primary' | 'accent' | 'success' | 'warning' | 'red' | 'orange';
}

export function SectionEyebrow({ label, colorPalette = 'primary' }: SectionEyebrowProps) {
  return (
    <Reveal>
      <Flex
        align="center"
        gap={2}
        display="inline-flex"
        bg={`${colorPalette}.subtle`}
        px={3}
        py={1.5}
        borderRadius="full"
        mb={4}
      >
        <Flex w={1.5} h={1.5} borderRadius="full" bg={`${colorPalette}.500`} />
        <Text
          textStyle="2xs"
          fontWeight="bold"
          color={`${colorPalette}.fg`}
          letterSpacing="wider"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </Flex>
    </Reveal>
  );
}
