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
  private static calculatePartialCredit(
    fields: (string | null | undefined | boolean | Date)[],
    weight: number
  ): number {
    const completed = fields.filter(Boolean).length;
    return (completed / fields.length) * weight;
  }

  /**
   * Calculate profile completeness percentage
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
   * Check if personal info is complete
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
   * Check if business info is complete
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
