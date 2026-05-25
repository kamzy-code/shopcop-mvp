import { AdminShell } from '@/components/shared/adminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
