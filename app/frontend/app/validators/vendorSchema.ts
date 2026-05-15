import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Food & Groceries',
  'Health & Beauty',
  'Home & Garden',
  'Automobiles',
  'Services',
  'Other',
] as const;

export const DELIVERY_AREAS = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Benin City',
  'Nationwide',
] as const;

export const PAYMENT_METHODS = [
  'Full Upfront',
  'Cash on Delivery',
  'Part Payment',
  'Bank Transfer',
] as const;

export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be at most 100 characters'),
  categories: z
    .array(z.string())
    .min(1, 'Select at least one category')
    .max(3, 'Select at most 3 categories'),
  address: z.string().min(5, 'Please enter a valid address'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
});

export const bvnSchema = z.object({
  bvn: z
    .string()
    .regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
});

export const ninSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full legal name is required'),
  nin: z
    .string()
    .regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  price: z.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK']),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
export type BvnFormData = z.infer<typeof bvnSchema>;
export type NinFormData = z.infer<typeof ninSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
