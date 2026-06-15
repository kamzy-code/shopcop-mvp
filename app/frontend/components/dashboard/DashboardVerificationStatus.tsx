'use client';
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { LuShieldAlert, LuShieldCheck } from 'react-icons/lu';

interface VerificationItem {
  label: string;
  done: boolean;
  status: string | undefined;
  href: string | undefined;
}

interface DashboardVerificationStatusProps {
  items: VerificationItem[];
}

export function DashboardVerificationStatus({ items }: DashboardVerificationStatusProps) {
  const router = useRouter();
  return (
    <Box p={5} bg="bg.panel" borderWidth="1px" borderColor="border" borderRadius="xl">
      <Flex align="center" justify="space-between" mb={4}>
        <Flex align="center" gap={3}>
          <LuShieldCheck size={18} color="var(--chakra-colors-primary-600)" />
          <Text fontWeight="semibold" color="fg" textStyle="sm">
            Verification Status
          </Text>
        </Flex>
        <Button
          variant="ghost"
          size="xs"
          color="primary.fg"
          px={2}
          h="auto"
          py={0.5}
          onClick={() => router.push('/vendor/profile?tab=verifications')}
        >
          View all
        </Button>
      </Flex>
      <Stack gap={3}>
        {items.map((item) => (
          <Flex key={item.label} align="center" gap={3}>
            <Flex
              w={5}
              h={5}
              borderRadius="full"
              bg={
                item.done
                  ? 'success.500'
                  : item.status === 'REJECTED'
                    ? 'red.500'
                    : item.status === 'PENDING'
                      ? 'warning.400'
                      : 'bg.subtle'
              }
              borderWidth={item.done || item.status ? 0 : '2px'}
              borderColor="border"
              align="center"
              justify="center"
              flexShrink={0}
            >
              {item.done && <LuShieldCheck size={10} color="white" />}
              {!item.done && item.status === 'PENDING' && <LuShieldAlert size={10} color="white" />}
              {!item.done && item.status === 'REJECTED' && <LuShieldAlert size={10} color="white" />}
            </Flex>
            <Text textStyle="sm" color={item.done ? 'fg' : 'fg.muted'} flex={1}>
              {item.label}
            </Text>
            <Box>
              {item.done ? (
                <Text textStyle="xs" fontWeight="medium" color="success.fg">Done</Text>
              ) : item.status === 'PENDING' ? (
                <Text textStyle="xs" fontWeight="medium" color="warning.fg">Pending</Text>
              ) : item.status === 'REJECTED' ? (
                <Button variant="ghost" size="xs" color="red.600" px={2} h="auto" py={0.5} onClick={() => item.href && router.push(item.href)}>
                  Resubmit
                </Button>
              ) : item.href ? (
                <Button variant="ghost" size="xs" color="primary.fg" px={2} h="auto" py={0.5} onClick={() => router.push(item.href!)}>
                  Start
                </Button>
              ) : (
                <Text textStyle="xs" fontWeight="medium" color="fg.subtle">—</Text>
              )}
            </Box>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}
