import { z } from 'zod';

// ============================================
// LIST ORDERS QUERY VALIDATION
// ============================================

const ORDER_STATUS_VALUES = [
  'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_DISPATCH', 'SHIPPED', 'DELIVERED',
  'COMPLETED', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS', 'REFUNDED', 'RESOLVED', 'CANCELLED',
] as const;
const PAYMENT_STATUS_VALUES = ['UNPAID', 'PROOF_SUBMITTED', 'PAID', 'REFUNDED'] as const;
const REFUND_STATUS_VALUES = ['NONE', 'REQUESTED', 'IN_PROGRESS', 'REFUNDED', 'RESOLVED'] as const;

/** Validates query parameters for the admin order list: filters, search, pagination. */
export const listAdminOrdersQuerySchema = z
  .object({
    vendor_id: z.string().optional(),
    status: z.enum(ORDER_STATUS_VALUES, { error: `Status must be one of: ${ORDER_STATUS_VALUES.join(', ')}` }).optional(),
    payment_status: z
      .enum(PAYMENT_STATUS_VALUES, { error: `payment_status must be one of: ${PAYMENT_STATUS_VALUES.join(', ')}` })
      .optional(),
    refund_status: z
      .enum(REFUND_STATUS_VALUES, { error: `refund_status must be one of: ${REFUND_STATUS_VALUES.join(', ')}` })
      .optional(),
    search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
    from_date: z.coerce.date({ error: 'from_date must be a valid date' }).optional(),
    to_date: z.coerce.date({ error: 'to_date must be a valid date' }).optional(),
    sort: z.enum(['newest', 'oldest', 'amount_asc', 'amount_desc']).default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((data) => !data.from_date || !data.to_date || data.from_date <= data.to_date, {
    message: 'from_date must be before or equal to to_date',
    path: ['from_date'],
  });

export type ListAdminOrdersQuery = z.infer<typeof listAdminOrdersQuerySchema>;

// ============================================
// ANALYTICS QUERY VALIDATION
// ============================================

const ANALYTICS_PERIOD_VALUES = ['daily', 'weekly', 'monthly', 'yearly', 'all_time'] as const;

/** Validates the period (+ optional anchor date) filter for GET /admin/orders/analytics. */
export const orderAnalyticsQuerySchema = z.object({
  period: z
    .enum(ANALYTICS_PERIOD_VALUES, { error: `period must be one of: ${ANALYTICS_PERIOD_VALUES.join(', ')}` })
    .default('monthly'),
  // Anchors the period to a specific day/week/month/year instead of the current one.
  date: z.coerce.date({ error: 'date must be a valid date' }).optional(),
});

export type AnalyticsPeriod = (typeof ANALYTICS_PERIOD_VALUES)[number];
