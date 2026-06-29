import { z } from 'zod';

// ============================================
// LIST PRODUCTS QUERY VALIDATION
// ============================================

/** Validates query parameters for the admin product list: filters, search, pagination. */
export const listAdminProductsQuerySchema = z.object({
  vendor_id: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
  flagged: z
    .enum(['true', 'false'], { error: 'flagged must be true or false' })
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  low_stock: z
    .enum(['true', 'false'], { error: 'low_stock must be true or false' })
    .optional()
    .transform((val) => val === 'true'),
  search: z.string().max(100, 'Search term must be less than 100 characters').optional(),
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// ADMIN PRODUCT EDIT VALIDATION
// ============================================

/** Validates an admin's full-override edit of a product. All fields optional. */
export const adminUpdateProductSchema = z.object({
  name: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  price: z.number().min(100).max(10_000_000).optional(),
  category: z.string().min(1).optional(),
  stock_status: z.enum(['IN_STOCK', 'OUT_OF_STOCK']).optional(),
  stock_quantity: z.number().int().min(0).optional(),
});

// ============================================
// FLAG / APPROVE VALIDATION
// ============================================

/** Validates an admin's reason for flagging a product for quality review. */
export const flagProductSchema = z.object({
  reason: z.string().trim().min(3, 'Flag reason is required').max(500),
});

export type ListAdminProductsQuery = z.infer<typeof listAdminProductsQuerySchema>;
export type AdminUpdateProductInput = z.infer<typeof adminUpdateProductSchema>;
export type FlagProductInput = z.infer<typeof flagProductSchema>;
