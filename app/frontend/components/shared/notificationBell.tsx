'use client';
import {
  Badge,
  Box,
  Button,
  Flex,
  IconButton,
  Popover,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { LuBell, LuCheck } from 'react-icons/lu';
import {
  Notification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '@/app/_hooks/useNotifications';

// ─── Single notification row ──────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();
  const markRead = useMarkRead();

  const handleClick = () => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.action_url) router.push(notification.action_url);
  };

  return (
    <Flex
      align="flex-start"
      gap={3}
      px={4}
      py={3}
      cursor={notification.action_url ? 'pointer' : 'default'}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottomWidth: 0 }}
      _hover={{ bg: 'bg.subtle' }}
      transition="background 0.1s"
      onClick={handleClick}
    >
      {/* Unread indicator dot */}
      <Box
        flexShrink={0}
        mt="5px"
        w={2}
        h={2}
        borderRadius="full"
        bg={notification.read ? 'transparent' : 'teal.500'}
        borderWidth={notification.read ? '1px' : 0}
        borderColor="border"
      />

      <Box flex={1} minW={0}>
        <Text
          textStyle="sm"
          fontWeight={notification.read ? 'normal' : 'semibold'}
          color="fg"
          truncate
        >
          {notification.title}
        </Text>
        <Text textStyle="xs" color="fg.muted" lineClamp={2} mt={0.5}>
          {notification.message}
        </Text>
        <Text textStyle="2xs" color="fg.subtle" mt={1}>
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </Text>
      </Box>
    </Flex>
  );
}

// ─── Bell with popover ────────────────────────────────────────────────────────

export function NotificationBell() {
  const { data } = useNotifications();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Box position="relative" display="inline-flex">
          <IconButton variant="ghost" size="sm" aria-label="Notifications" color="fg.muted">
            <LuBell />
          </IconButton>
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorPalette="red"
              borderRadius="full"
              minW="18px"
              h="18px"
              fontSize="10px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={1}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Box>
      </Popover.Trigger>

      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="360px"
            maxW="calc(100vw - 32px)"
            bg="bg.panel"
            borderColor="border"
            shadow="lg"
            p={0}
          >
            {/* Header */}
            <Flex
              align="center"
              justify="space-between"
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Text textStyle="sm" fontWeight="semibold" color="fg">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="fg.muted"
                  gap={1}
                  onClick={() => markAllRead.mutate()}
                  loading={markAllRead.isPending}
                >
                  <LuCheck size={12} />
                  Mark all read
                </Button>
              )}
            </Flex>

            {/* List */}
            <Box maxH="400px" overflowY="auto">
              {notifications.length === 0 ? (
                <Flex align="center" justify="center" py={10}>
                  <Stack align="center" gap={1}>
                    <LuBell size={20} color="var(--chakra-colors-fg-muted)" />
                    <Text textStyle="sm" color="fg.muted">
                      {`You're all caught up`}
                    </Text>
                  </Stack>
                </Flex>
              ) : (
                notifications.map((n) => <NotificationItem key={n.id} notification={n} />)
              )}
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
