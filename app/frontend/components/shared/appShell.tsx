'use client';
import {
  LuLayoutDashboard,
  LuPackage,
  LuSettings,
  LuShoppingCart,
  LuStar,
  LuUser,
} from 'react-icons/lu';
import BaseShell, { type NavItemConfig } from './BaseShell';

const VENDOR_NAV_ITEMS: NavItemConfig[] = [
  { label: 'Dashboard', icon: LuLayoutDashboard, href: '/dashboard' },
  { label: 'Products', icon: LuPackage, href: '/products' },
  { label: 'Orders', icon: LuShoppingCart, href: '/orders' },
  { label: 'Profile', icon: LuUser, href: '/vendor/profile' },
  { label: 'Reviews', icon: LuStar, href: '/reviews' },
  { label: 'Settings', icon: LuSettings, href: '/settings', disabled: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return <BaseShell navItems={VENDOR_NAV_ITEMS} variant="vendor">{children}</BaseShell>;
}
