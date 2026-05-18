import { prisma } from '@config/prisma.js';
import { vendorLogger } from '@utils/logger.js';
import { ProfileCompletenessService } from './profileCompletenessService.js';
import { PersonalInfoInput, BusinessInfoInput } from '../types/vendorProfileTypes.js';
import { AppError } from '@middleware/errorHandler.js';
import { VerificationStatus, VerificationType } from 'generated/prisma/enums.js';

// ============================================
// VENDOR PROFILE SERVICE
// ============================================

export class VendorProfileService {
  /**
   * Update personal information (Step 1)
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

    // Recalculate profile completeness
    const completeness = ProfileCompletenessService.calculateCompleteness(vendorProfile);

    await prisma.vendorProfile.update({
      where: { id: vendorProfile.id },
      data: { profile_completeness: completeness },
    });

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
   * Update business information (Step 2)
   */
  static async updateBusinessInfo(userId: string, data: BusinessInfoInput) {
    // Get vendor profile
    const existingProfile = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      include: { verifications: true },
    });

    if (!existingProfile) {
      vendorLogger.warn('please complete personal information first', {
        action: 'updateBusinesssInformation',
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
   * Get vendor profile
   */
  static async getVendorProfile(userId: string) {
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
   * Get profile completeness breakdown
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
          personal_info: { completed: false, weight: 20, percentage: 0 },
          business_info: { completed: false, weight: 20, percentage: 0 },
          nin_verification: { completed: false, weight: 20, percentage: 0 },
          address_verification: { completed: false, weight: 15, percentage: 0 },
          business_verification: { completed: false, weight: 25, percentage: 0 },
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
          weight: 20,
          percentage: vendorProfile.personal_info_complete ? 20 : 0,
        },
        business_info: {
          completed: vendorProfile.business_info_complete,
          weight: 20,
          percentage: vendorProfile.business_info_complete ? 20 : 0,
        },
        nin_verification: {
          completed: ninVerified,
          weight: 20,
          percentage: ninVerified ? 20 : 0,
        },
        address_verification: {
          completed: addressVerified,
          weight: 15,
          percentage: addressVerified ? 15 : 0,
        },
        business_verification: {
          completed: businessVerified,
          weight: 25,
          percentage: businessVerified ? 25 : 0,
        },
      },
    };

    return breakdown;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Calculate age from date of birth
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
   * Generate unique slug from business name
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
      action: 'generateUnqiueSlug',
      businessName,
    });
    throw new AppError('Failed to generate unique slug');
  }
}
