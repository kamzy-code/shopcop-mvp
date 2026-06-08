'use client';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuStore } from 'react-icons/lu';

interface PublicNavbarProps {
  businessName?: string | null;
  maxW?: Record<string, string> | string;
}

export function PublicNavbar({ businessName, maxW = '520px' }: PublicNavbarProps) {
  return (
    <Box bg="bg.panel" borderBottomWidth="1px" borderColor="border" px={4} py={3}>
      <Flex align="center" justify="space-between" maxW={maxW} mx="auto">
        <Flex align="center" gap={2}>
          <Flex
            w={7}
            h={7}
            borderRadius="md"
            bg="primary.500"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <LuStore size={14} color="white" />
          </Flex>
          <Text fontWeight="bold" textStyle="sm" color="fg">
            ShopCop
          </Text>
        </Flex>
        {businessName && (
          <Text textStyle="sm" color="fg.muted">
            by {businessName}
          </Text>
        )}
      </Flex>
    </Box>
  );
}
