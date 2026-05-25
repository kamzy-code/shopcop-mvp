'use client';
import { Box, Button, Flex, IconButton, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LuBell,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuShieldCheck,
  LuStore,
  LuUsers,
  LuX,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useAuthStore } from '@/app/_store/authStore';
import { useLogout } from '@/app/_hooks/auth';
import { ColorModeButton } from '@/components/ui/color-mode';

interface NavItemConfig {
  label: string;
  icon: IconType;
  href: string;
}

const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', icon: LuLayoutDashboard, href: '/admin' },
  { label: 'Verifications', icon: LuShieldCheck, href: '/admin/verifications' },
  { label: 'Users', icon: LuUsers, href: '/admin/users' },
];

function UserAvatar({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email?.[0] ?? 'A').toUpperCase();

  return (
    <Flex
      w={8}
      h={8}
      borderRadius="full"
      bg="primary.subtle"
      align="center"
      justify="center"
      flexShrink={0}
    >
      <Text textStyle="xs" fontWeight="bold" color="primary.fg">
        {initials}
      </Text>
    </Flex>
  );
}

function NavItemRow({ item, onClose }: { item: NavItemConfig; onClose?: () => void }) {
  const pathname = usePathname();
  // Dashboard is only active on exact /admin path; others match prefix
  const isActive =
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <NextLink href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
      <Flex
        align="center"
        gap={3}
        px={3}
        py={2.5}
        borderRadius="lg"
        bg={isActive ? 'primary.subtle' : 'transparent'}
        color={isActive ? 'primary.fg' : 'fg.muted'}
        fontWeight={isActive ? 'semibold' : 'normal'}
        transition="all 0.15s"
        _hover={{ bg: isActive ? 'primary.subtle' : 'bg.subtle', color: 'fg' }}
      >
        <item.icon size={16} />
        <Text textStyle="sm">{item.label}</Text>
      </Flex>
    </NextLink>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    router.push('/auth/login');
  };

  return (
    <Flex direction="column" h="full" py={5}>
      {/* Logo */}
      <Flex align="center" px={5} mb={8} gap={2.5}>
        <Flex
          w={8}
          h={8}
          borderRadius="lg"
          bg="primary.500"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <LuStore size={16} color="white" />
        </Flex>
        <Box>
          <Text fontWeight="bold" textStyle="lg" color="fg" lineHeight="tight">
            ShopCop
          </Text>
          <Text textStyle="2xs" color="fg.muted" fontWeight="medium">
            Admin Panel
          </Text>
        </Box>
        {onClose && (
          <IconButton
            ms="auto"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close menu"
            color="fg.muted"
          >
            <LuX />
          </IconButton>
        )}
      </Flex>

      {/* Nav items */}
      <Stack gap={0.5} flex={1} px={3}>
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavItemRow key={item.href} item={item} onClose={onClose} />
        ))}
      </Stack>

      {/* User section */}
      <Box px={3} pt={4} borderTopWidth="1px" borderColor="border">
        <Flex align="center" gap={3} px={2} py={2} mb={1}>
          <UserAvatar name={user?.name} email={user?.email} />
          <Box flex={1} overflow="hidden">
            <Text textStyle="sm" fontWeight="medium" color="fg" truncate>
              {user?.name || 'Admin'}
            </Text>
            <Text textStyle="xs" color="fg.subtle" truncate>
              {user?.email}
            </Text>
          </Box>
        </Flex>

        <Button
          variant="ghost"
          size="sm"
          w="full"
          justifyContent="flex-start"
          gap={3}
          color="fg.muted"
          onClick={handleLogout}
          loading={logoutMutation.isPending}
          px={3}
        >
          <LuLogOut size={16} />
          Logout
        </Button>
      </Box>
    </Flex>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Flex minH="100dvh" bg="bg">
      {/* Desktop sidebar */}
      <Box
        display={{ base: 'none', lg: 'block' }}
        w="240px"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="border"
        bg="bg.panel"
        position="sticky"
        top={0}
        h="100dvh"
        overflowY="auto"
      >
        <SidebarContent />
      </Box>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={50}
          display={{ lg: 'none' }}
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0,0,0,0.5)"
            onClick={() => setIsSidebarOpen(false)}
          />
          <Box
            position="absolute"
            top={0}
            left={0}
            bottom={0}
            w="240px"
            bg="bg.panel"
            borderRightWidth="1px"
            borderColor="border"
            zIndex={1}
            overflowY="auto"
          >
            <SidebarContent onClose={() => setIsSidebarOpen(false)} />
          </Box>
        </Box>
      )}

      {/* Main content area */}
      <Flex direction="column" flex={1} overflow="hidden" minW={0}>
        {/* Top nav */}
        <Flex
          align="center"
          px={{ base: 4, md: 6 }}
          h="60px"
          borderBottomWidth="1px"
          borderColor="border"
          bg="bg.panel"
          gap={3}
          flexShrink={0}
        >
          <IconButton
            display={{ base: 'flex', lg: 'none' }}
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            color="fg.muted"
          >
            <LuMenu />
          </IconButton>
          <Box flex={1} />
          <ColorModeButton />
          <IconButton variant="ghost" size="sm" aria-label="Notifications" color="fg.muted">
            <LuBell />
          </IconButton>
        </Flex>

        {/* Page content */}
        <Box flex={1} overflow="auto" p={{ base: 4, md: 6, lg: 8 }}>
          <Box maxW="1400px" mx="auto" w="full">
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
