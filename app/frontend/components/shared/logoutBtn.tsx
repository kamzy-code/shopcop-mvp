'use client'
import { useLogout } from '@/app/_hooks/auth';
import { useAuthStore } from '@/app/_store/authStore';
import { Button } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const logoutMutation = useLogout();
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();                    // clears Zustand + persisted localStorage
    router.push('/auth/login');
  };
  return <Button onClick={handleLogout} loading={logoutMutation.isPending}>Logout</Button>;
}