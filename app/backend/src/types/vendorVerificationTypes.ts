import { BusinessType } from '../generated/prisma/client.js';

export interface NINVerificationInput {
  nin_number: string;
  nin_full_name: string;
  govt_id_front_url: string;
  govt_id_back_url?: string;
}

export interface CACVerificationInput {
  cac_rc_number: string;
  cac_company_type: BusinessType;
  cac_certificate_url: string;
}

export interface SMEDANVerificationInput {
  smedan_suin: string;
  smedan_business_type: BusinessType;
  smedan_certificate_url: string;
}

export interface AddressVerificationInput {
  address_document_url: string;
}

export const sectionWeights = {
  PERSONAL_INFO: 20, // 20% of profile
  BUSINESS_INFO: 20, // 20% of profile
  NIN_VERIFICATION: 20, // 20% of profile
  ADDRESS_VERIFICATION: 15, // 15% of profile
  BUSINESS_VERIFICATION: 25, // 25% of profile (CAC or SMEDAN)
} as const;

// Verification Points System
export const verificationPoints = {
  PERSONAL_INFO: 0,      // Prerequisite, no points
  BUSINESS_INFO: 0,      // Prerequisite, no points
  NIN_VERIFIED: 10,      // Identity verification
  ADDRESS_VERIFIED: 5,   // Location confirmation
  CAC_VERIFIED: 15,      // Formal business registration
  SMEDAN_VERIFIED: 8,    // SME registration
} as const;

// Tier Thresholds
export const tierThresholds = {
  TIER_0: 0,       // 0 points   - Unverified
  TIER_1: 8,       // 8-14 points - Basic verified
  TIER_2: 15,      // 15-19 points - Business verified
  TIER_3: 20,      // 20-29 points - Highly verified
  TIER_4: 30,      // 30+ points  - Elite verified
} as const;