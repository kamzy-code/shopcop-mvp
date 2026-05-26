import { z } from 'zod';

const mediaItemSchema = z.object({
  url: z.string().url('Each media item must have a valid URL'),
  public_id: z.string().optional(),
  media_type: z.enum(['IMAGE', 'VIDEO'], 'media_type must be IMAGE or VIDEO'),
});

export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(200, 'Product name must be at most 200 characters'),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  price: z
    .number()
    .min(100, 'Price must be at least ₦100')
    .max(10_000_000, 'Price must be at most ₦10,000,000'),
  category: z.string().min(1, 'Please select a category'),
  stock_status: z.enum(['IN_STOCK', 'OUT_OF_STOCK'], 'Stock status must be IN_STOCK or OUT_OF_STOCK'),
  media: z.array(mediaItemSchema).max(8, 'Maximum 8 media items allowed').optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
