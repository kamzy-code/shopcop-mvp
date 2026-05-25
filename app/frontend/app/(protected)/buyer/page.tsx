'use client';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LuLogOut, LuShoppingCart } from 'react-icons/lu';
import { useLogout } from '@/app/_hooks/auth';
import { useAuthStore } from '@/app/_store/authStore';

export default function BuyerHomePage() {
  const logout = useAuthStore((s) => s.logout);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

  return (
    <Flex minH="100dvh" align="center" justify="center" bg="bg" p={6}>
      <Box textAlign="center" maxW="sm">
        <Flex
          w={16}
          h={16}
          borderRadius="2xl"
          bg="primary.subtle"
          align="center"
          justify="center"
          mx="auto"
          mb={6}
          color="primary.fg"
        >
          <LuShoppingCart size={28} />
        </Flex>
        <Heading as="h1" textStyle="2xl" fontWeight="bold" color="fg" mb={2}>
          Buyer Home
        </Heading>
        <Text color="fg.muted" textStyle="sm" mb={6}>
          Buyer features are coming soon. Stay tuned!
        </Text>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          loading={logoutMutation.isPending}
        >
          <LuLogOut />
          Sign out
        </Button>
      </Box>
    </Flex>
  );
}
