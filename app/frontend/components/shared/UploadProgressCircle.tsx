'use client';
import { ProgressCircle } from '@chakra-ui/react';

interface UploadProgressCircleProps {
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/** Circular upload-progress ring, used in place of a plain spinner wherever real percentage is available. */
export function UploadProgressCircle({ value, size = 'md' }: UploadProgressCircleProps) {
  return (
    <ProgressCircle.Root value={value} size={size}>
      <ProgressCircle.Circle>
        <ProgressCircle.Track css={{ stroke: 'whiteAlpha.500' }} />
        <ProgressCircle.Range css={{ stroke: 'white' }} strokeLinecap="round" />
      </ProgressCircle.Circle>
      <ProgressCircle.ValueText color="white" textStyle="xs" fontWeight="bold" />
    </ProgressCircle.Root>
  );
}
