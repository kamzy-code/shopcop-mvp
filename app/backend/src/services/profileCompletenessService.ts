import { PersonalInfoInput, BusinessInfoInput } from "../types/vendorProfileTypes.js";

// ============================================
// PROFILE COMPLETENESS CALCULATOR
// ============================================

export class ProfileCompletenessService {
  /**
   * Calculate profile completeness percentage
   */
  static calculateCompleteness(vendorProfile: any): number {
    let totalWeight = 0;
    let completedWeight = 0;

    // Personal Info - 20%
    const personalInfoWeight = 20;
    if (vendorProfile.personal_info_complete) {
      completedWeight += personalInfoWeight;
    } else {
      // Partial credit for personal info
      const personalFields = [
        vendorProfile.first_name,
        vendorProfile.last_name,
        vendorProfile.gender,
        vendorProfile.date_of_birth,
        vendorProfile.phone_number,
      ];
      const completedPersonalFields = personalFields.filter(Boolean).length;
      completedWeight += (completedPersonalFields / 5) * personalInfoWeight;
    }
    totalWeight += personalInfoWeight;

    // Business Info - 20%
    const businessInfoWeight = 20;
    if (vendorProfile.business_info_complete) {
      completedWeight += businessInfoWeight;
    } else {
      // Partial credit for business info
      const businessFields = [
        vendorProfile.business_name,
        vendorProfile.business_description,
        vendorProfile.state,
        vendorProfile.city,
        vendorProfile.street_address,
        vendorProfile.primary_category,
        vendorProfile.bank_name,
        vendorProfile.account_number,
      ];
      const completedBusinessFields = businessFields.filter(Boolean).length;
      completedWeight += (completedBusinessFields / 8) * businessInfoWeight;
    }
    totalWeight += businessInfoWeight;

    // NIN Verification - 20%
    const ninVerificationWeight = 20;
    const ninVerification = vendorProfile.verifications?.find(
      (v: any) => v.type === 'NIN' && v.status === 'APPROVED'
    );
    if (ninVerification) {
      completedWeight += ninVerificationWeight;
    }
    totalWeight += ninVerificationWeight;

    // Address Verification - 15%
    const addressVerificationWeight = 15;
    const addressVerification = vendorProfile.verifications?.find(
      (v: any) => v.type === 'ADDRESS' && v.status === 'APPROVED'
    );
    if (addressVerification) {
      completedWeight += addressVerificationWeight;
    }
    totalWeight += addressVerificationWeight;

    // Business Verification (CAC or SMEDAN) - 25%
    const businessVerificationWeight = 25;
    const businessVerification = vendorProfile.verifications?.find(
      (v: any) => (v.type === 'CAC' || v.type === 'SMEDAN') && v.status === 'APPROVED'
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
