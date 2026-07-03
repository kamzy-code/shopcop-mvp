'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

interface ProcessStepProps {
  icon: IconType;
  step: string;
  title: string;
  description: string;
  isLast?: boolean;
}

export function ProcessStep({
  icon: StepIcon,
  step,
  title,
  description,
  isLast = false,
}: ProcessStepProps) {
  return (
    <Box position="relative" flex="1 1 220px" maxW="280px" minW="220px">
      {/* {!isLast && (
        <Box
          display={{ base: 'none', md: 'block' }}
          position="absolute"
          top="32px"
          left="calc(50% + 48px)"
          right="-64px"
          h="0"
          borderTopWidth="2px"
          borderStyle="dashed"
          borderColor="primary.700"
          zIndex={0}
        />
      )} */}

      <Flex
        direction="column"
        align="center"
        textAlign="center"
        gap={4}
        position="relative"
        zIndex={1}
      >
        <Flex
          w={16}
          h={16}
          borderRadius="full"
          bg="primary.100"
          align="center"
          justify="center"
          position="relative"
        >
          <StepIcon size={26} color="var(--chakra-colors-primary-700)" />
          <Flex
            position="absolute"
            top={-2}
            right={-2}
            w={7}
            h={7}
            borderRadius="full"
            bg="primary.500"
            align="center"
            justify="center"
          >
            <Text textStyle="xs" color="white" fontWeight="bold">
              {step}
            </Text>
          </Flex>
        </Flex>

        <Box>
          <Text fontWeight="semibold" textStyle="md" color="primary.900" mb={1}>
            {title}
          </Text>
          <Text textStyle="sm" color="primary.800" lineHeight="1.6">
            {description}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
