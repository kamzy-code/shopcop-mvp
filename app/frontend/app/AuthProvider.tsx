// app/AuthProvider.tsx
'use client';
import { useEffect } from 'react';
import { useAuthStore } from './_store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const revalidateSession = useAuthStore((s) => s.revalidateSession);

  useEffect(() => {
    revalidateSession();
  }, []);
  return <>{children}</>;
}
