import { z } from 'zod';

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

export const PAYMENT_MODEL_OPTIONS = [
  { value: 'FULL_PAYMENT', label: 'Full Payment' },
  { value: 'PAY_ON_DELIVERY', label: 'Pay on Delivery' },
  { value: 'PART_PAYMENT', label: 'Part Payment' },
  { value: 'INSTALLMENT', label: 'Installment' },
] as const;

export const REFUND_POLICY_OPTIONS = [
  { value: 'NO_REFUNDS', label: 'No Refunds' },
  { value: 'FULL_REFUND', label: 'Full Refund' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund' },
  { value: 'EXCHANGE_ONLY', label: 'Exchange Only' },
  { value: 'STORE_CREDIT', label: 'Store Credit' },
  { value: 'CASE_BY_CASE', label: 'Case by Case' },
] as const;

export const REFUND_DURATION_OPTIONS = [
  { value: 7,  label: '7 days'  },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
] as const;

export const CONTACT_OPTIONS = [
  { value: 'WHATSAPP',   label: 'WhatsApp'   },
  { value: 'INSTAGRAM',  label: 'Instagram'  },
  { value: 'TIKTOK',     label: 'TikTok'     },
  { value: 'FACEBOOK',   label: 'Facebook'   },
  { value: 'PHONE_CALL', label: 'Phone Call' },
] as const;

export const COMMON_REFUND_CONDITIONS = [
  'Item must be unused and in original packaging',
  'Proof of purchase required',
  'Return shipping paid by buyer',
  'Items must be returned within the refund window',
  'Digital products are non-refundable',
  'Sale items are final sale',
  'Custom or personalised items are non-refundable',
] as const;

export const businessInfoSchema = z.object({
  business_name: z
    .string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be less than 100 characters'),
  business_description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(500, 'Description must be less than 500 characters'),
  state: z.string().min(2, 'Please select a state'),
  city: z.string().min(2, 'City is required'),
  street_address: z.string().min(5, 'Street address is required'),
  landmark: z.string().optional(),
  primary_category: z.string().min(1, 'Please select a primary category'),
  subcategories: z
    .array(z.string())
    .min(1, 'Select at least one subcategory')
    .max(3, 'Select up to 3 subcategories'),
  bank_name: z.string().min(2, 'Bank name is required'),
  account_number: z
    .string()
    .regex(/^\d{10}$/, 'Account number must be exactly 10 digits'),
  account_name: z
    .string()
    .min(3, 'Account name is required')
    .max(100, 'Account name must be less than 100 characters'),
  payment_models: z
    .array(z.enum(['FULL_PAYMENT', 'PAY_ON_DELIVERY', 'PART_PAYMENT', 'INSTALLMENT']))
    .min(1, 'Select at least one payment model'),
  refund_policy_type: z.enum(
    ['NO_REFUNDS', 'FULL_REFUND', 'PARTIAL_REFUND', 'EXCHANGE_ONLY', 'STORE_CREDIT', 'CASE_BY_CASE'],
    { error: 'Please select a refund policy' }
  ),
  refund_duration_days: z.number().int().min(1).max(90).optional(),
  refund_conditions: z
    .array(z.string().max(200, 'Each condition must be 200 characters or fewer'))
    .max(10, 'You can add up to 10 conditions')
    .optional(),
  refund_custom_notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  instagram_handle: z
    .string()
    .regex(/^@?[\w.]+$/, 'Invalid handle')
    .optional()
    .or(z.literal('')),
  tiktok_handle: z
    .string()
    .regex(/^@?[\w.]+$/, 'Invalid handle')
    .optional()
    .or(z.literal('')),
  facebook_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  whatsapp_number: z
    .string()
    .regex(/^(\+234|0)[789]\d{9}$/, 'Enter a valid Nigerian number')
    .optional()
    .or(z.literal('')),
  primary_contact: z
    .enum(['WHATSAPP', 'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'PHONE_CALL'])
    .optional(),
}).superRefine((data, ctx) => {
  const hasContact = [
    data.instagram_handle,
    data.tiktok_handle,
    data.facebook_url,
    data.whatsapp_number,
  ].some((v) => v && v.trim().length > 0);

  if (!hasContact) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Add at least one contact method so buyers can reach you',
      path: ['instagram_handle'],
    });
  }
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

export const CAC_COMPANY_TYPES = [
  { value: 'LIMITED_LIABILITY', label: 'Limited Liability Company (LLC)' },
  { value: 'BUSINESS_NAME', label: 'Business Name Registration' },
  { value: 'INCORPORATED_TRUSTEES', label: 'Incorporated Trustees' },
] as const;

export const SMEDAN_BUSINESS_TYPES = [
  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'COOPERATIVE', label: 'Cooperative Society' },
] as const;

const RC_REGEX = /^[A-Z0-9-]+$/i;
const SUIN_REGEX = /^[A-Z0-9-]+$/i;

export const cacVerificationSchema = z.object({
  cac_rc_number: z
    .string()
    .min(2, 'RC number is required')
    .max(20, 'RC number must be less than 20 characters')
    .regex(RC_REGEX, 'RC number can only contain letters, numbers, and hyphens'),
  cac_company_type: z.enum(
    ['LIMITED_LIABILITY', 'BUSINESS_NAME', 'INCORPORATED_TRUSTEES'],
    { error: 'Please select a company type' }
  ),
});

export const smedanVerificationSchema = z.object({
  smedan_suin: z
    .string()
    .min(5, 'SUIN must be at least 5 characters')
    .max(50, 'SUIN must be less than 50 characters')
    .regex(SUIN_REGEX, 'SUIN can only contain letters, numbers, and hyphens'),
  smedan_business_type: z.enum(
    ['SOLE_PROPRIETOR', 'PARTNERSHIP', 'COOPERATIVE'],
    { error: 'Please select a business type' }
  ),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(200, 'Product name must be at most 200 characters'),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  price: z.number().min(100, 'Price must be at least ₦100').max(10_000_000, 'Price must be at most ₦10,000,000'),
  category: z.string().min(1, 'Please select a category'),
  stock_status: z.enum(['IN_STOCK', 'OUT_OF_STOCK']),
  stock_quantity: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .optional(),
});

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type NinFormData = z.infer<typeof ninSchema>;
export type CacVerificationFormData = z.infer<typeof cacVerificationSchema>;
export type SmedanVerificationFormData = z.infer<typeof smedanVerificationSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
