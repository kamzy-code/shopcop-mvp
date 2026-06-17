import { prisma } from '@config/prisma.js';
import { vendorLogger } from '@utils/logger.js';
import { ProfileCompletenessService } from './profileCompletenessService.js';
import { PersonalInfoInput, BusinessInfoInput } from '../types/vendorProfileTypes.js';
import { AppError } from '@middleware/errorHandler.js';
import { VerificationStatus, VerificationType } from '../generated/prisma/enums.js';
import { sectionWeights } from '../types/vendorVerificationTypes.js';

// ============================================
// VENDOR PROFILE SERVICE
// ============================================

export class VendorProfileService {
  /**
   * Update personal information (Step 1 of vendor onboarding).
   * Validates minimum age (16+), upserts the vendor profile, and recalculates completeness.
   *
   * @param userId - Authenticated user's ID
   * @param data - Personal info input: first_name, last_name, gender, date_of_birth, phone_number
   * @returns Updated vendor profile with profile_completeness
   * @throws {AppError} 400 — Age is under 16
   */
  static async updatePersonalInfo(userId: string, data: PersonalInfoInput) {
    // Validate age (must be 18+)
    const age = this.calculateAge(data.date_of_birth);
    if (age < 16) {
      vendorLogger.warn('You must be at least 16 years old to crearte a vendor account', {
        action: 'updatePersonalInfo',
        userId,
      });
      throw new AppError('You must be at least 16 years old to create a vendor account', 400);
    }

    const vendorProfile = await prisma.vendorProfile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
        personal_info_complete: ProfileCompletenessService.isPersonalInfoComplete(data),
      },
      update: {
        ...data,
        personal_info_complete: ProfileCompletenessService.isPersonalInfoComplete(data),
      },
      include: { verifications: true },
    });

    // Recalculate profile completeness and sync display name on the User record
    const completeness = ProfileCompletenessService.calculateCompleteness(vendorProfile);

    await prisma.$transaction([
      prisma.vendorProfile.update({
        where: { id: vendorProfile.id },
        data: { profile_completeness: completeness },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { name: `${data.first_name} ${data.last_name}` },
      }),
    ]);

    vendorLogger.info(`Personal info updated for vendor: ${userId}`, {
      userId,
      action: 'updatePersonalInfo',
    });

    return {
      ...vendorProfile,
      profile_completeness: completeness,
    };
  }

  /**
   * Update business information (Step 2 of vendor onboarding).
   * Requires personal info to be completed first. Generates a unique slug from business name
   * and recalculates profile completeness.
   *
   * @param userId - Authenticated user's ID
   * @param data - Business info input: name, description, location, category, bank, payment models, social handles, etc.
   * @returns Updated vendor profile with profile_completeness
   * @throws {AppError} 400 — Personal info not completed first
   */
  static async updateBusinessInfo(userId: string, data: BusinessInfoInput) {
    // Get vendor profile
    const existingProfile = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      include: { verifications: true },
    });

    if (!existingProfile) {
      vendorLogger.warn('please complete personal information first', {
        action: 'updateBusinessInfo',
        userId,
      });
      throw new AppError('Please complete personal information first', 400);
    }

    // Generate slug from business name
    const slug = await this.generateUniqueSlug(data.business_name, existingProfile.id);

    // Update profile
    const vendorProfile = await prisma.vendorProfile.update({
      where: { id: existingProfile.id },
      data: {
        ...data,
        slug,
        business_info_complete: ProfileCompletenessService.isBusinessInfoComplete(data),
      },
      include: { verifications: true },
    });

    // Recalculate completeness
    const completeness = ProfileCompletenessService.calculateCompleteness(vendorProfile);

    await prisma.vendorProfile.update({
      where: { id: vendorProfile.id },
      data: { profile_completeness: completeness },
    });

    vendorLogger.info(`Business info updated for vendor: ${userId}`, {
      action: 'updateBussinessInfo',
      userId,
    });

    return {
      ...vendorProfile,
      profile_completeness: completeness,
    };
  }

   /**
    * Get a vendor profile by user ID. Returns null if not found.
    *
    * @param userId - Authenticated user's ID
    * @returns VendorProfile or null
    */
  static async getVendorProfile(userId: string) {
    return prisma.vendorProfile.findUnique({ where: { user_id: userId } });
  }

  /**
   * Get vendor profile including all verifications (ordered newest-first) and user details.
   * Calculates and returns current profile completeness.
   *
   * @param userId - Authenticated user's ID
   * @returns Vendor profile with verifications, user info, and profile_completeness, or null if not found
   */
  static async getVendorProfileWithVerifications(userId: string) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      include: {
        verifications: {
          orderBy: { submitted_at: 'desc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!vendorProfile) {
      return null;
    }

    // Calculate current completeness
    const completeness = ProfileCompletenessService.calculateCompleteness(vendorProfile);

    return {
      ...vendorProfile,
      profile_completeness: completeness,
    };
  }

  /**
   * Get a detailed profile completeness breakdown by section.
   * Returns zero values for all sections if the vendor profile does not exist.
   *
   * @param userId - Authenticated user's ID
   * @returns Breakdown object with total_completeness and per-section status/weight/percentage
   */
  static async getProfileCompletenessBreakdown(userId: string) {
    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      include: { verifications: true },
    });

    if (!vendorProfile) {
      return {
        total_completeness: 0,
        sections: {
          personal_info: { completed: false, weight: sectionWeights.PERSONAL_INFO, percentage: 0 },
          business_info: { completed: false, weight: sectionWeights.BUSINESS_INFO, percentage: 0 },
          nin_verification: {
            completed: false,
            weight: sectionWeights.NIN_VERIFICATION,
            percentage: 0,
          },
          address_verification: {
            completed: false,
            weight: sectionWeights.ADDRESS_VERIFICATION,
            percentage: 0,
          },
          business_verification: {
            completed: false,
            weight: sectionWeights.BUSINESS_VERIFICATION,
            percentage: 0,
          },
        },
      };
    }

    const ninVerified = vendorProfile.verifications.some(
      (v) => v.type === VerificationType.NIN && v.status === VerificationStatus.APPROVED
    );
    const addressVerified = vendorProfile.verifications.some(
      (v) => v.type === VerificationType.ADDRESS && v.status === VerificationStatus.APPROVED
    );
    const businessVerified = vendorProfile.verifications.some(
      (v) =>
        (v.type === VerificationType.CAC || v.type === VerificationType.SMEDAN) &&
        v.status === VerificationStatus.APPROVED
    );

    const breakdown = {
      total_completeness: ProfileCompletenessService.calculateCompleteness(vendorProfile),
      sections: {
        personal_info: {
          completed: vendorProfile.personal_info_complete,
          weight: sectionWeights.PERSONAL_INFO,
          percentage: vendorProfile.personal_info_complete ? 20 : 0,
        },
        business_info: {
          completed: vendorProfile.business_info_complete,
          weight: sectionWeights.BUSINESS_INFO,
          percentage: vendorProfile.business_info_complete ? 20 : 0,
        },
        nin_verification: {
          completed: ninVerified,
          weight: sectionWeights.NIN_VERIFICATION,
          percentage: ninVerified ? 20 : 0,
        },
        address_verification: {
          completed: addressVerified,
          weight: sectionWeights.ADDRESS_VERIFICATION,
          percentage: addressVerified ? 15 : 0,
        },
        business_verification: {
          completed: businessVerified,
          weight: sectionWeights.BUSINESS_VERIFICATION,
          percentage: businessVerified ? 25 : 0,
        },
      },
    };

    return breakdown;
  }

  /**
   * Update the vendor's profile photo URL.
   *
   * @param userId - Authenticated user's ID
   * @param profile_photo_url - Cloudinary URL of the uploaded photo
   * @returns Updated vendor profile
   * @throws {AppError} 404 — Vendor profile not found
   */
  static async updateProfilePhoto(userId: string, profile_photo_url: string, profile_photo_public_id?: string) {
    const existing = await prisma.vendorProfile.findUnique({ where: { user_id: userId } });
    if (!existing) {
      throw new AppError('Vendor profile not found', 404);
    }

    return prisma.vendorProfile.update({
      where: { user_id: userId },
      data: { profile_photo_url, profile_photo_public_id: profile_photo_public_id ?? null },
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Calculate age from a date of birth.
   *
   * @param dateOfBirth - Date of birth
   * @returns Age in years
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Generate a unique URL-safe slug from a business name.
   * Appends a random 4-digit suffix if the base slug already exists.
   * Throws if a unique slug cannot be generated after 10 attempts.
   *
   * @param businessName - The business name to convert to a slug
   * @param currentProfileId - Current profile ID to exclude from duplicate check (optional)
   * @returns A unique slug string
   * @throws {AppError} — Failed to generate unique slug after 10 attempts
   */
  private static async generateUniqueSlug(
    businessName: string,
    currentProfileId?: string
  ): Promise<string> {
    // Convert to slug format
    const baseSlug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Check if slug exists (excluding current profile)
      const existing = await prisma.vendorProfile.findFirst({
        where: {
          slug,
          ...(currentProfileId && { id: { not: currentProfileId } }),
        },
      });

      if (!existing) {
        return slug;
      }

      // Append random 4-digit number
      const suffix = Math.floor(1000 + Math.random() * 9000);
      slug = `${baseSlug}-${suffix}`;
      attempts++;
    }
    vendorLogger.warn('Failed to generate unique slug', {
      action: 'generateUniqueSlug',
      businessName,
    });
    throw new AppError('Failed to generate unique slug');
  }
}
