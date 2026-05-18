import { z } from 'zod';
import {
  Gender,
  PaymentModel,
  PrimaryContactMethod,
  RefundPolicyType,
} from '../generated/prisma/client.js';

// ============================================
// PERSONAL INFO VALIDATION
// ============================================

export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  middle_name: z
    .string()
    .max(50, 'Middle name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]*$/,
      'Middle name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .optional(),

  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  gender: z.enum(Gender, 'Gender must be MALE, FEMALE, or PREFER_NOT_TO_SAY'),

  date_of_birth: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 120;
    }, 'You must be at least 16 years old'),

  phone_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .transform((val) => {
      // Normalize to +234 format
      if (val.startsWith('0')) {
        return '+234' + val.slice(1);
      }
      return val;
    }),
});

// ============================================
// BUSINESS INFO VALIDATION
// ============================================

export const businessInfoSchema = z.object({
  // Basic Details
  business_name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be less than 100 characters'),

  business_description: z
    .string()
    .min(50, 'Business description must be at least 50 characters')
    .max(500, 'Business description must be less than 500 characters'),

  // Location
  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  street_address: z.string().min(5, 'Street address is required'),
  landmark: z.string().optional(),

  // Categories
  primary_category: z.string().min(1, 'Primary category is required'),
  subcategories: z
    .array(z.string())
    .min(1, 'Select at least one subcategory')
    .max(3, 'You can select up to 3 subcategories'),

  // Payment Information
  bank_name: z.string().min(2, 'Bank name is required'),
  account_number: z.string().regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  account_name: z
    .string()
    .min(3, 'Account name is required')
    .max(100, 'Account name must be less than 100 characters'),
  payment_models: z.array(z.enum(PaymentModel)).min(1, 'Select at least one payment model'),

  // Social Media
  instagram_handle: z
    .string()
    .regex(/^@?[\w.]+$/, 'Invalid Instagram handle')
    .optional()
    .or(z.literal('')),

  tiktok_handle: z
    .string()
    .regex(/^@?[\w.]+$/, 'Invalid TikTok handle')
    .optional()
    .or(z.literal('')),

  facebook_url: z.url('Invalid Facebook URL').optional().or(z.literal('')),

  whatsapp_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid WhatsApp number')
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val) return val;
      if (val.startsWith('0')) {
        return '+234' + val.slice(1);
      }
      return val;
    }),

  primary_contact: z.enum(PrimaryContactMethod).optional(),

  // Refund Policy
  refund_policy_type: z.enum(RefundPolicyType, 'Invalid refund policy type'),

  refund_duration_days: z
    .number()
    .int()
    .min(1, 'Refund duration must be at least 1 day')
    .max(90, 'Refund duration cannot exceed 90 days')
    .optional(),

  refund_conditions: z.array(z.string()).optional(),

  refund_custom_notes: z
    .string()
    .max(500, 'Refund notes must be less than 500 characters')
    .optional(),
});
