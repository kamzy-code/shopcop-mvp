import { UserRole } from '@/app/_types';

/**
 * Returns the correct home page URL for a given user role.
 * Used by root page, public layout, and post-login redirects to ensure
 * each role lands on their appropriate section of the app.
 *
 * @param role - The authenticated user's role, or undefined if unauthenticated
 * @returns Absolute path to the role's home page
 */
export function getRoleHomePage(role: UserRole | undefined): string {
  switch (role) {
    case 'ADMIN':  return '/admin';
    case 'VENDOR': return '/dashboard';
    case 'BUYER':  return '/buyer';
    default:       return '/auth/login';
  }
}
