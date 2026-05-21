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
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .regex(NAME_REGEX, 'Letters, spaces, hyphens, and apostrophes only'),
  middle_name: z
    .string()
    .max(50, 'Middle name must be at most 50 characters')
    .regex(NAME_REGEX, 'Letters, spaces, hyphens, and apostrophes only')
    .optional(),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(NAME_REGEX, 'Letters, spaces, hyphens, and apostrophes only'),
  gender: z.enum(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'], {
    error: 'Please select a gender',
  }),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      const age =
        today.getFullYear() -
        dob.getFullYear() -
        (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
      return age >= 16;
    }, 'You must be at least 16 years old'),
  phone_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Enter a valid Nigerian number (e.g. 08012345678)'),
});

export const ninSchema = z.object({
  nin_full_name: z.string().min(2, 'Full legal name is required'),
  nin_number: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  price: z.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK']),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type NinFormData = z.infer<typeof ninSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
