import { z } from 'zod';
import { BusinessType } from '../generated/prisma/client.js';

// ============================================
// NIN VERIFICATION VALIDATION
// ============================================

export const ninVerificationSchema = z.object({
  nin_number: z
    .string()
    .regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),

  nin_full_name: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Full name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  govt_id_front_url: z.url('Invalid government ID front image URL'),
  govt_id_front_public_id: z.string().min(1, 'Front ID public_id is required'),

  govt_id_back_url: z.url('Invalid government ID back image URL').optional(),
  govt_id_back_public_id: z.string().min(1, 'Back ID public_id is required').optional(),
});

// ============================================
// CAC VERIFICATION VALIDATION
// ============================================

export const cacVerificationSchema = z.object({
  cac_rc_number: z
    .string()
    .min(2, 'RC number is required')
    .max(20, 'RC number must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/i, 'RC number can only contain letters, numbers, and hyphens'),

  cac_company_type: z.enum(BusinessType, 'Invalid company type'),

  cac_certificate_url: z.url('Invalid CAC certificate URL'),
  cac_certificate_public_id: z.string().min(1, 'CAC certificate public_id is required'),
});

// ============================================
// SMEDAN VERIFICATION VALIDATION
// ============================================

export const smedanVerificationSchema = z.object({
  smedan_suin: z
    .string()
    .min(5, 'SUIN must be at least 5 characters')
    .max(50, 'SUIN must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/i, 'SUIN can only contain letters, numbers, and hyphens'),

  smedan_business_type: z.enum(BusinessType, 'Invalid company type'),

  smedan_certificate_url: z.url('Invalid SMEDAN certificate URL'),
  smedan_certificate_public_id: z.string().min(1, 'SMEDAN certificate public_id is required'),
});

// ============================================
// ADDRESS VERIFICATION VALIDATION
// ============================================

export const addressVerificationSchema = z.object({
  address_document_url: z.url('Invalid address document URL'),
  address_document_public_id: z.string().min(1, 'Address document public_id is required'),
});

// ============================================
// RESUBMIT VERIFICATION VALIDATION
// ============================================

export const resubmitVerificationSchema = ninVerificationSchema
  .merge(cacVerificationSchema)
  .merge(smedanVerificationSchema)
  .merge(addressVerificationSchema)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be updated',
  });
