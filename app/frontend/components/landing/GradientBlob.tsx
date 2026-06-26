'use client';
import { Box } from '@chakra-ui/react';

interface GradientBlobProps {
  color?: string;
  size?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
}

export function GradientBlob({
  color = 'var(--chakra-colors-primary-500)',
  size = '420px',
  top,
  left,
  right,
  bottom,
  opacity = 0.18,
}: GradientBlobProps) {
  return (
    <Box
      position="absolute"
      top={top}
      left={left}
      right={right}
      bottom={bottom}
      w={size}
      h={size}
      pointerEvents="none"
      zIndex={0}
      borderRadius="full"
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        filter: 'blur(40px)',
      }}
    />
  );
}
