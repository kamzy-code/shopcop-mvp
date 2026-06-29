'use client';
import { LuLayoutDashboard, LuShieldCheck, LuUser, LuUsers, LuPackage, LuReceipt } from 'react-icons/lu';
import BaseShell, { type NavItemConfig } from './BaseShell';

const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', icon: LuLayoutDashboard, href: '/admin' },
  { label: 'Verifications', icon: LuShieldCheck, href: '/admin/verifications' },
  { label: 'Products', icon: LuPackage, href: '/admin/products' },
  { label: 'Orders', icon: LuReceipt, href: '/admin/orders' },
  { label: 'Users', icon: LuUsers, href: '/admin/users' },
  { label: 'Profile', icon: LuUser, href: '/admin/profile' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <BaseShell navItems={ADMIN_NAV_ITEMS} variant="admin">{children}</BaseShell>;
}
