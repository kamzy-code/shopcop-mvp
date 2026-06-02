'use client';
import { Box, Flex } from '@chakra-ui/react';
import { LuStar } from 'react-icons/lu';

interface ReviewStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function ReviewStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}: ReviewStarsProps) {
  const sizeMap = { sm: 14, md: 18, lg: 24 };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <Flex gap={0.5}>
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const filled = value <= rating;
        const half = !filled && value - 0.5 <= rating;
        return (
          <Box
            key={value}
            as="button"
            cursor={interactive ? 'pointer' : 'default'}
            onClick={() => handleClick(value)}
            color={filled || half ? 'yellow.400' : 'gray.300'}
            _dark={{ color: filled || half ? 'yellow.300' : 'gray.600' }}
            transition="color 0.15s"
            _hover={interactive ? { color: 'yellow.500' } : undefined}
          >
            <LuStar size={sizeMap[size]} fill={filled || half ? 'currentColor' : 'none'} />
          </Box>
        );
      })}
    </Flex>
  );
}
