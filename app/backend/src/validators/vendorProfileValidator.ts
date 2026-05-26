import { z } from 'zod';
import {
  Gender,
  PaymentModel,
  PrimaryContactMethod,
  RefundPolicyType,
} from '../generated/prisma/client.js';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;
const NAME_REGEX_MSG = 'Can only contain letters, spaces, hyphens, and apostrophes';

/** Normalises a Nigerian phone number to the +234 international format. */
function normalizePhone(val: string) {
  if (val.startsWith('0')) return '+234' + val.slice(1);
  return val;
}

/**
 * Returns a Zod field for optional, non-empty URL strings.
 * Accepts a valid URL, an empty string, or undefined.
 */
function optionalUrl() {
  return z.url().optional().or(z.literal(''));
}

/**
 * Returns a Zod field for optional social media handles (with or without leading @).
 * Accepts alphanumeric characters, underscores, dots, or empty string.
 */
function optionalSocialHandle() {
  return z.string().regex(/^@?[\w.]+$/, 'Invalid handle').optional().or(z.literal(''));
}

// ============================================
// PERSONAL INFO VALIDATION
// ============================================

/** Validates Step 1 of vendor onboarding: personal details including age (≥16) and Nigerian phone number. */
export const personalInfoSchema = z.object({
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(NAME_REGEX, `First name ${NAME_REGEX_MSG}`),

  middle_name: z
    .string()
    .max(50, 'Middle name must be less than 50 characters')
    .regex(NAME_REGEX, `Middle name ${NAME_REGEX_MSG}`)
    .optional(),

  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(NAME_REGEX, `Last name ${NAME_REGEX_MSG}`),

  gender: z.enum(Gender, 'Gender must be MALE, FEMALE, or PREFER_NOT_TO_SAY'),

  date_of_birth: z.coerce
    .date()
    .refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 16 && age <= 120;
    }, 'You must be at least 16 years old'),

  phone_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number')
    .transform(normalizePhone),
});

// ============================================
// BUSINESS INFO VALIDATION
// ============================================

/** Validates Step 2 of vendor onboarding: business profile, location, payment models, social handles, and refund policy. */
export const businessInfoSchema = z.object({
  business_name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be less than 100 characters'),

  business_description: z
    .string()
    .min(50, 'Business description must be at least 50 characters')
    .max(500, 'Business description must be less than 500 characters'),

  state: z.string().min(2, 'State is required'),
  city: z.string().min(2, 'City is required'),
  street_address: z.string().min(5, 'Street address is required'),
  landmark: z.string().optional(),

  primary_category: z.string().min(1, 'Primary category is required'),
  subcategories: z
    .array(z.string())
    .min(1, 'Select at least one subcategory')
    .max(3, 'You can select up to 3 subcategories'),

  bank_name: z.string().min(2, 'Bank name is required'),
  account_number: z.string().regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  account_name: z
    .string()
    .min(3, 'Account name is required')
    .max(100, 'Account name must be less than 100 characters'),
  payment_models: z.array(z.enum(PaymentModel)).min(1, 'Select at least one payment model'),

  instagram_handle: optionalSocialHandle(),
  tiktok_handle: optionalSocialHandle(),
  facebook_url: optionalUrl(),

  whatsapp_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Invalid WhatsApp number')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ? normalizePhone(val) : val)),

  primary_contact: z.enum(PrimaryContactMethod).optional(),

  refund_policy_type: z.enum(RefundPolicyType, 'Invalid refund policy type'),

  refund_duration_days: z
    .number()
    .int()
    .min(1, 'Refund duration must be at least 1 day')
    .max(90, 'Refund duration cannot exceed 90 days')
    .optional(),

  refund_conditions: z
    .array(z.string().max(200, 'Each condition must be 200 characters or fewer'))
    .max(10, 'You can add up to 10 refund conditions')
    .optional(),

  refund_custom_notes: z
    .string()
    .max(500, 'Refund notes must be less than 500 characters')
    .optional(),
});
