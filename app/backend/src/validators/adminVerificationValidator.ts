import { z } from 'zod';

// ============================================
// APPROVE VERIFICATION VALIDATION
// ============================================

/** Validates admin approval payload: an optional internal note (max 500 chars). */
export const approveVerificationSchema = z.object({
  admin_notes: z
    .string()
    .max(500, 'Admin notes must be less than 500 characters')
    .optional(),
});

// ============================================
// REJECT VERIFICATION VALIDATION
// ============================================

/** Validates admin rejection payload: a required reason (10–500 chars) and an optional internal note. */
export const rejectVerificationSchema = z.object({
  rejection_reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),

  admin_notes: z
    .string()
    .max(500, 'Admin notes must be less than 500 characters')
    .optional(),
});