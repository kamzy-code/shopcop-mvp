'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';

export interface FeatureCardProps {
  number: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  imageSide?: 'left' | 'right';
}

export function FeatureCard({ number, title, description, imageUrl, imageAlt, imageSide = 'right' }: FeatureCardProps) {
  return (
    <Flex
      direction={{ base: 'column', md: imageSide === 'right' ? 'row' : 'row-reverse' }}
      align="center"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="lg"
      p={{base: 4, md: 16}}
    >
      <Box flex={1} p={{ base: 8, md: 12 }}>
        <Flex
          w={10}
          h={10}
          borderRadius="full"
          bg="primary.500"
          align="center"
          justify="center"
          mb={5}
          boxShadow="sm"
        >
          <Text textStyle="md" fontWeight="bold" color="white">
            {number}
          </Text>
        </Flex>
        <Text fontWeight="extrabold" textStyle={{ base: 'xl', md: '2xl' }} color="fg" mb={3} letterSpacing="tight">
          {title}
        </Text>
        <Text textStyle="sm" color="fg.muted" lineHeight="1.6">
          {description}
        </Text>
      </Box>
      <Box flex={{ md: 1 }} position="relative" w="full" h={{ base: '240px', md: '480px' }} borderRadius={{ base: 'lg', md: '2xl' }} overflow="hidden">
        <Image src={imageUrl} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'contain' }} />
      </Box>
    </Flex>
  );
}
