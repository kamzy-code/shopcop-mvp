import { z } from 'zod';

/**
 * Schema for creating a new business category.
 * All fields except `name`, `slug`, and `subcategories` are optional.
 */
export const createCategorySchema = z.object({
  /** Human-readable category name (e.g. "Fashion"). Must be unique. */
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be under 100 characters'),

  /** URL-safe slug (e.g. "fashion"). Must be unique. Only lowercase letters, digits, and hyphens. */
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be under 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, digits, and hyphens'),

  /** Optional short description of the category. */
  description: z.string().max(500, 'Description must be under 500 characters').optional(),

  /** Optional URL for a category icon or image. */
  icon_url: z.string().url('icon_url must be a valid URL').optional(),

  /** List of subcategory names belonging to this category. At least 1 required, max 20. */
  subcategories: z
    .array(z.string().min(1, 'Subcategory name cannot be empty').max(100, 'Subcategory name too long'))
    .min(1, 'At least one subcategory is required')
    .max(20, 'Maximum 20 subcategories allowed'),

  /** Controls display ordering in the UI. Defaults to 0 if omitted. */
  display_order: z.number().int().min(0, 'display_order must be a non-negative integer').optional(),
});

/**
 * Schema for partially updating an existing business category.
 * All fields are optional — only provide what needs to change.
 */
export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
