'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminShell } from '@/components/shared/adminShell';
import { useAdminProfile } from '@/app/_hooks/admin';
import FullPageSpinner from '@/components/shared/fullPageSpinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile, isLoading } = useAdminProfile();

  const isOnboarding = pathname === '/admin/onboarding';

  useEffect(() => {
    if (isLoading) return;

    if (isOnboarding) {
      // If already complete, redirect away from onboarding to dashboard
      if (profile && profile.profile_complete) {
        router.replace('/admin');
      }
    } else {
      // All other admin routes: redirect to onboarding if profile is missing or incomplete
      if (profile === null || (profile && !profile.profile_complete)) {
        router.replace('/admin/onboarding');
      }
    }
  }, [isLoading, profile, isOnboarding, router]);

  if (isLoading) return <FullPageSpinner />;

  // On onboarding route: prevent flash of content while redirect fires (if already complete)
  if (isOnboarding) {
    if (profile && profile.profile_complete) return null;
    return <>{children}</>;
  }

  // On all other admin routes: prevent flash while redirect fires (if incomplete)
  if (profile === null || (profile && !profile.profile_complete)) return null;

  return <AdminShell>{children}</AdminShell>;
}
