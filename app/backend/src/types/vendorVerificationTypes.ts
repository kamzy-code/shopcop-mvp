import { BusinessType } from '../generated/prisma/client.js';

/** Input for submitting NIN identity verification. */
export interface NINVerificationInput {
  nin_number: string;
  nin_full_name: string;
  govt_id_front_url: string;
  govt_id_front_public_id: string;
  govt_id_back_url?: string;
  govt_id_back_public_id?: string;
}

/** Input for submitting CAC business registration verification. */
export interface CACVerificationInput {
  cac_rc_number: string;
  cac_company_type: BusinessType;
  cac_certificate_url: string;
  cac_certificate_public_id: string;
}

/** Input for submitting SMEDAN registration verification. */
export interface SMEDANVerificationInput {
  smedan_suin: string;
  smedan_business_type: BusinessType;
  smedan_certificate_url: string;
  smedan_certificate_public_id: string;
}

/** Input for submitting proof-of-address document verification. */
export interface AddressVerificationInput {
  address_document_url: string;
  address_document_public_id: string;
}

/** Weight of each profile section in the overall completeness calculation (0-100). */
export const sectionWeights = {
  PERSONAL_INFO: 20,
  BUSINESS_INFO: 20,
  NIN_VERIFICATION: 20,
  ADDRESS_VERIFICATION: 15,
  BUSINESS_VERIFICATION: 25,
} as const;

/** Points awarded per completed verification type for tier calculation. */
export const verificationPoints = {
  PERSONAL_INFO: 0,
  BUSINESS_INFO: 0,
  NIN_VERIFIED: 10,
  ADDRESS_VERIFIED: 5,
  CAC_VERIFIED: 15,
  SMEDAN_VERIFIED: 8,
} as const;

/** Minimum points thresholds for each vendor tier. */
export const tierThresholds = {
  TIER_0: 0,
  TIER_1: 8,
  TIER_2: 15,
  TIER_3: 20,
  TIER_4: 30,
} as const;