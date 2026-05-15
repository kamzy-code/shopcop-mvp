'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';

interface Step {
  label: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <Flex align="flex-start" w="full">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <Flex key={index} align="flex-start" flex={isLast ? undefined : 1}>
            <Flex direction="column" align="center" gap={1.5} flexShrink={0}>
              <Flex
                w={8}
                h={8}
                borderRadius="full"
                align="center"
                justify="center"
                bg={isCompleted || isActive ? 'primary.500' : 'bg.subtle'}
                borderWidth={isCompleted || isActive ? 0 : '2px'}
                borderColor="border"
                color={isCompleted || isActive ? 'white' : 'fg.muted'}
                fontWeight="bold"
                textStyle="sm"
                flexShrink={0}
                transition="all 0.2s"
              >
                {isCompleted ? <LuCheck size={14} /> : stepNum}
              </Flex>
              <Text
                textStyle="xs"
                fontWeight={isActive ? 'semibold' : 'normal'}
                color={isActive ? 'primary.fg' : isCompleted ? 'fg.muted' : 'fg.subtle'}
                whiteSpace="nowrap"
                textAlign="center"
              >
                {step.label}
              </Text>
            </Flex>

            {!isLast && (
              <Box
                flex={1}
                h="2px"
                bg={isCompleted ? 'primary.500' : 'border'}
                mt={4}
                mx={2}
                transition="background 0.2s"
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
