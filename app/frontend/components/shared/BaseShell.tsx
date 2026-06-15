'use client';
import { Box, Button, Flex, IconButton, Stack, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LuBell, LuLogOut, LuMenu, LuStore, LuX } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useAuthStore } from '@/app/_store/authStore';
import { useLogout } from '@/app/_hooks/auth';
import { ColorModeButton } from '@/components/ui/color-mode';

export interface NavItemConfig {
  label: string;
  icon: IconType;
  href: string;
  disabled?: boolean;
}

interface BaseShellProps {
  navItems: NavItemConfig[];
  variant: 'vendor' | 'admin';
  children: React.ReactNode;
}

function UserAvatar({ name, email, variant }: { name?: string; email?: string; variant: 'vendor' | 'admin' }) {
  const fallback = variant === 'admin' ? 'A' : 'U';
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (email?.[0] ?? fallback).toUpperCase();

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

function NavItemRow({
  item,
  onClose,
  variant,
}: {
  item: NavItemConfig;
  onClose?: () => void;
  variant: 'vendor' | 'admin';
}) {
  const pathname = usePathname();
  const isActive =
    variant === 'admin' && item.href === '/admin'
      ? pathname === '/admin'
      : pathname === item.href || pathname.startsWith(item.href + '/');

  if (item.disabled) {
    return (
      <Flex
        align="center"
        gap={3}
        px={3}
        py={2.5}
        borderRadius="lg"
        opacity={0.4}
        cursor="not-allowed"
        userSelect="none"
      >
        <item.icon size={16} />
        <Text textStyle="sm" color="fg.muted">
          {item.label}
        </Text>
        <Box
          ml="auto"
          px={1.5}
          py={0.5}
          borderRadius="sm"
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
        >
          <Text textStyle="2xs" color="fg.muted" fontWeight="medium">
            Soon
          </Text>
        </Box>
      </Flex>
    );
  }

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

function SidebarContent({
  navItems,
  variant,
  onClose,
}: {
  navItems: NavItemConfig[];
  variant: 'vendor' | 'admin';
  onClose?: () => void;
}) {
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
        {variant === 'admin' ? (
          <Box>
            <Text fontWeight="bold" textStyle="lg" color="fg" lineHeight="tight">
              ShopCop
            </Text>
            <Text textStyle="2xs" color="fg.muted" fontWeight="medium">
              Admin Panel
            </Text>
          </Box>
        ) : (
          <Text fontWeight="bold" textStyle="lg" color="fg">
            ShopCop
          </Text>
        )}
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

      <Stack gap={0.5} flex={1} px={3}>
        {navItems.map((item) => (
          <NavItemRow key={item.href} item={item} onClose={onClose} variant={variant} />
        ))}
      </Stack>

      <Box px={3} pt={4} borderTopWidth="1px" borderColor="border">
        <Flex align="center" gap={3} px={2} py={2} mb={1}>
          <UserAvatar name={user?.name} email={user?.email} variant={variant} />
          <Box flex={1} overflow="hidden">
            <Text textStyle="sm" fontWeight="medium" color="fg" truncate>
              {user?.name || (variant === 'admin' ? 'Admin' : 'Vendor')}
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

export default function BaseShell({ navItems, variant, children }: BaseShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Flex minH="100dvh" bg="bg">
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
        <SidebarContent navItems={navItems} variant={variant} />
      </Box>

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
            <SidebarContent navItems={navItems} variant={variant} onClose={() => setIsSidebarOpen(false)} />
          </Box>
        </Box>
      )}

      <Flex direction="column" flex={1} overflow="hidden" minW={0}>
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

        <Box flex={1} overflow="auto" p={{ base: 4, md: 6, lg: 8 }}>
          <Box maxW="1400px" mx="auto" w="full">
            {children}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
