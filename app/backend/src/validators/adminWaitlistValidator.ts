import { z } from 'zod';

// ============================================
// LIST WAITLIST QUERY VALIDATION
// ============================================

/** Validates query parameters for listing waitlist entries with filters and pagination. */
export const listWaitlistQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'CONVERTED', 'IGNORED']).optional(),
  user_type: z.enum(['BUY', 'SELL', 'BOTH']).optional(),
  open_to_chat: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  search: z
    .string()
    .trim()
    .max(100, 'Search term must be less than 100 characters')
    .optional(),
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
// UPDATE WAITLIST STATUS VALIDATION
// ============================================

/** Validates admin status update payload for waitlist entries. */
export const updateWaitlistStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'CONVERTED', 'IGNORED'], {
    error: 'Status must be PENDING, CONTACTED, CONVERTED, or IGNORED',
  }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must be under 2000 characters')
    .optional()
    .or(z.literal('')),
});

export type ListWaitlistQuery = z.infer<typeof listWaitlistQuerySchema>;
export type UpdateWaitlistStatusInput = z.infer<typeof updateWaitlistStatusSchema>;