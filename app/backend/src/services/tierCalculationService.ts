import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { VendorTier, VerificationStatus } from '../generated/prisma/client.js';

// ============================================
// TIER CALCULATION SERVICE
// ============================================

export class TierCalculationService {
  /**
   * Calculate and update vendor tier based on verification points
   */
  static async calculateAndUpdateTier(vendorId: string): Promise<VendorTier> {
    const action = 'calculateAndUpdateTier';

    try {
      const approvedVerifications = await prisma.vendorVerification.findMany({
        where: {
          vendor_id: vendorId,
          status: VerificationStatus.APPROVED,
        },
      });

      const totalPoints = approvedVerifications.reduce(
        (sum, verification) => sum + verification.points_value,
        0
      );

      const newTier = TierCalculationService.calculateTier(totalPoints);

      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          verification_points: totalPoints,
          current_tier: newTier,
        },
      });

      adminLogger.info('Tier updated', {
        action,
        vendorId,
        totalPoints,
        newTier,
      });

      return newTier;
    } catch (error) {
      adminLogger.error('Failed to calculate and update tier', {
        action,
        vendorId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Calculate tier from points
   */
  private static calculateTier(points: number): VendorTier {
    if (points >= 30) return VendorTier.TIER_4; // Premium verified
    if (points >= 20) return VendorTier.TIER_3; // Elite seller
    if (points >= 15) return VendorTier.TIER_2; // Business verified
    if (points >= 8) return VendorTier.TIER_1; // Basic verified
    return VendorTier.TIER_0; // Unverified
  }

  /**
   * Get tier breakdown for a vendor
   */
  static async getTierBreakdown(vendorId: string) {
    const action = 'getTierBreakdown';

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        verifications: {
          where: { status: VerificationStatus.APPROVED },
        },
      },
    });

    if (!vendorProfile) {
      adminLogger.warn('Vendor profile not found for tier breakdown', { action, vendorId });
      throw new AppError('Vendor profile not found', 404);
    }

    const verificationBreakdown = vendorProfile.verifications.map((v) => ({
      type: v.type,
      points: v.points_value,
      approved_at: v.approved_at,
    }));

    const breakdown = {
      current_tier: vendorProfile.current_tier,
      total_points: vendorProfile.verification_points,
      next_tier: TierCalculationService.getNextTier(vendorProfile.current_tier),
      points_to_next_tier: TierCalculationService.getPointsToNextTier(
        vendorProfile.verification_points
      ),
      verifications: verificationBreakdown,
      tier_benefits: TierCalculationService.getTierBenefits(vendorProfile.current_tier),
    };

    adminLogger.info('Tier breakdown fetched', {
      action,
      vendorId,
      currentTier: breakdown.current_tier,
      totalPoints: breakdown.total_points,
    });

    return breakdown;
  }

  /**
   * Get next tier
   */
  private static getNextTier(currentTier: VendorTier): VendorTier | null {
    const tiers: VendorTier[] = [
      VendorTier.TIER_0,
      VendorTier.TIER_1,
      VendorTier.TIER_2,
      VendorTier.TIER_3,
      VendorTier.TIER_4,
    ];

    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }

  /**
   * Get points needed to reach next tier
   */
  private static getPointsToNextTier(currentPoints: number): number | null {
    if (currentPoints >= 30) return null; // Already at max tier
    if (currentPoints >= 20) return 30 - currentPoints; // To TIER_4
    if (currentPoints >= 15) return 20 - currentPoints; // To TIER_3
    if (currentPoints >= 8) return 15 - currentPoints; // To TIER_2
    return 8 - currentPoints; // To TIER_1
  }

  /**
   * Get tier benefits
   */
  private static getTierBenefits(tier: VendorTier) {
    const benefits: Record<
      VendorTier,
      {
        badge: string | null;
        max_products: number | null;
        can_post_videos: boolean;
        featured_in_search: boolean;
        transaction_limit: number | null;
        support_priority: string;
      }
    > = {
      [VendorTier.TIER_0]: {
        badge: null,
        max_products: 5,
        can_post_videos: false,
        featured_in_search: false,
        transaction_limit: 50000,
        support_priority: 'standard',
      },
      [VendorTier.TIER_1]: {
        badge: '🟢 NOVA Verified',
        max_products: 20,
        can_post_videos: true,
        featured_in_search: false,
        transaction_limit: 200000,
        support_priority: 'standard',
      },
      [VendorTier.TIER_2]: {
        badge: '🔵 Business Verified',
        max_products: 50,
        can_post_videos: true,
        featured_in_search: true,
        transaction_limit: 1000000,
        support_priority: 'high',
      },
      [VendorTier.TIER_3]: {
        badge: '🟣 Elite Seller',
        max_products: 100,
        can_post_videos: true,
        featured_in_search: true,
        transaction_limit: 5000000,
        support_priority: 'premium',
      },
      [VendorTier.TIER_4]: {
        badge: '🏆 Premium Verified',
        max_products: null,
        can_post_videos: true,
        featured_in_search: true,
        transaction_limit: null,
        support_priority: 'vip',
      },
    };

    return benefits[tier];
  }
}
