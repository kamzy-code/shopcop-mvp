import { z } from 'zod';

// ============================================
// LIST USERS QUERY VALIDATION
// ============================================

/** Validates query parameters for listing users with optional filters and pagination. */
export const listUsersQuerySchema = z.object({
  role: z.enum(['VENDOR', 'BUYER', 'ADMIN']).optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
});

// ============================================
// UPDATE USER STATUS VALIDATION
// ============================================

/** Validates admin status update payload: required boolean to activate or deactivate a user. */
export const updateUserStatusSchema = z.object({
  is_active: z.boolean({ error: 'is_active must be a boolean' }),
});

// ============================================
// UPDATE USER ROLE VALIDATION
// ============================================

/** Validates admin role change payload: the new role must be one of the allowed values. */
export const updateUserRoleSchema = z.object({
  role: z.enum(['VENDOR', 'BUYER', 'ADMIN'], {
    error: 'Role must be one of: VENDOR, BUYER, ADMIN',
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
