import { PersonalInfoInput, BusinessInfoInput } from '../types/vendorProfileTypes.js';
import { sectionWeights } from '../types/vendorVerificationTypes.js';
import { VerificationType, VerificationStatus } from '../generated/prisma/client.js';

interface VendorProfileWithVerifications {
  personal_info_complete: boolean;
  business_info_complete: boolean;
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  date_of_birth?: Date | null;
  phone_number?: string | null;
  business_name?: string | null;
  business_description?: string | null;
  state?: string | null;
  city?: string | null;
  street_address?: string | null;
  primary_category?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  verifications?: { type: string; status: string }[];
}

// ============================================
// PROFILE COMPLETENESS CALCULATOR
// ============================================

export class ProfileCompletenessService {
  /**
   * Calculates a weighted partial credit score for a profile section based on
   * how many of its fields are truthy.
   *
   * @param fields - Array of field values to evaluate for completion
   * @param weight - Maximum point contribution of this section (e.g. 20 for personal info)
   * @returns A number between 0 and `weight` proportional to completed fields
   */
  private static calculatePartialCredit(
    fields: (string | null | undefined | boolean | Date)[],
    weight: number
  ): number {
    const completed = fields.filter(Boolean).length;
    return (completed / fields.length) * weight;
  }

  /**
   * Calculate profile completeness percentage based on weighted sections.
   * Personal info and business info each contribute 20% (with partial credit for incomplete sections).
   * NIN verification and address verification contribute 20% and 15% (all-or-nothing).
   * Business verification (CAC or SMEDAN) contributes 25% (all-or-nothing).
   *
   * @param vendorProfile - Vendor profile object with field values and verifications array
   * @returns Completeness percentage (0-100)
   */
  static calculateCompleteness(vendorProfile: VendorProfileWithVerifications): number {
    let totalWeight = 0;
    let completedWeight = 0;

    // Personal Info - 20%
    const personalInfoWeight = sectionWeights.PERSONAL_INFO;
    if (vendorProfile.personal_info_complete) {
      completedWeight += personalInfoWeight;
    } else {
      completedWeight += this.calculatePartialCredit(
        [
          vendorProfile.first_name,
          vendorProfile.last_name,
          vendorProfile.gender,
          vendorProfile.date_of_birth,
          vendorProfile.phone_number,
        ],
        personalInfoWeight
      );
    }
    totalWeight += personalInfoWeight;

    // Business Info - 20%
    const businessInfoWeight = sectionWeights.BUSINESS_INFO;
    if (vendorProfile.business_info_complete) {
      completedWeight += businessInfoWeight;
    } else {
      completedWeight += this.calculatePartialCredit(
        [
          vendorProfile.business_name,
          vendorProfile.business_description,
          vendorProfile.state,
          vendorProfile.city,
          vendorProfile.street_address,
          vendorProfile.primary_category,
          vendorProfile.bank_name,
          vendorProfile.account_number,
        ],
        businessInfoWeight
      );
    }
    totalWeight += businessInfoWeight;

    // NIN Verification - 20%
    const ninVerificationWeight = sectionWeights.NIN_VERIFICATION;
    const ninVerification = vendorProfile.verifications?.find(
      (v) => v.type === VerificationType.NIN && v.status === VerificationStatus.APPROVED
    );
    if (ninVerification) {
      completedWeight += ninVerificationWeight;
    }
    totalWeight += ninVerificationWeight;

    // Address Verification - 15%
    const addressVerificationWeight = sectionWeights.ADDRESS_VERIFICATION;
    const addressVerification = vendorProfile.verifications?.find(
      (v) => v.type === VerificationType.ADDRESS && v.status === VerificationStatus.APPROVED
    );
    if (addressVerification) {
      completedWeight += addressVerificationWeight;
    }
    totalWeight += addressVerificationWeight;

    // Business Verification (CAC or SMEDAN) - 25%
    const businessVerificationWeight = sectionWeights.BUSINESS_VERIFICATION;
    const businessVerification = vendorProfile.verifications?.find(
      (v) =>
        (v.type === VerificationType.CAC || v.type === VerificationType.SMEDAN) &&
        v.status === VerificationStatus.APPROVED
    );
    if (businessVerification) {
      completedWeight += businessVerificationWeight;
    }
    totalWeight += businessVerificationWeight;

    return Math.round((completedWeight / totalWeight) * 100);
  }

  /**
   * Check if all required personal info fields are filled.
   * Required: first_name, last_name, gender, date_of_birth, phone_number.
   *
   * @param data - Partial personal info input object
   * @returns True if all required fields are truthy
   */
  static isPersonalInfoComplete(data: Partial<PersonalInfoInput>): boolean {
    return !!(
      data.first_name &&
      data.last_name &&
      data.gender &&
      data.date_of_birth &&
      data.phone_number
    );
  }

  /**
   * Check if all required business info fields are filled.
   * Includes business details, location, category, subcategories, bank info, and payment models.
   *
   * @param data - Partial business info input object
   * @returns True if all required fields are truthy and arrays are non-empty
   */
  static isBusinessInfoComplete(data: Partial<BusinessInfoInput>): boolean {
    return !!(
      data.business_name &&
      data.business_description &&
      data.state &&
      data.city &&
      data.street_address &&
      data.primary_category &&
      data.subcategories &&
      data.subcategories.length > 0 &&
      data.bank_name &&
      data.account_number &&
      data.account_name &&
      data.payment_models &&
      data.payment_models.length > 0
    );
  }
}
