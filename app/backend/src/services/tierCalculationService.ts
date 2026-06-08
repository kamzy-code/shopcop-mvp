import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { VendorTier, VerificationStatus } from '../generated/prisma/client.js';

// ============================================
// TIER CALCULATION SERVICE
// ============================================

export class TierCalculationService {
  /**
   * Calculate and update vendor tier based on approved verification points.
   * Aggregates all approved verifications' point values, determines the tier,
   * and persists the updated tier and total points to the vendor profile.
   *
   * @param vendorId - Vendor profile ID
   * @returns The newly assigned VendorTier
   * @throws Database error on update failure
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
   * Map a total points score to a VendorTier.
   * TIER_4 (30+), TIER_3 (20-29), TIER_2 (15-19), TIER_1 (8-14), TIER_0 (0-7).
   *
   * @param points - Total accumulated verification points
   * @returns The corresponding VendorTier value
   */
  private static calculateTier(points: number): VendorTier {
    if (points >= 30) return VendorTier.TIER_4; // Premium verified
    if (points >= 20) return VendorTier.TIER_3; // Elite seller
    if (points >= 15) return VendorTier.TIER_2; // Business verified
    if (points >= 8) return VendorTier.TIER_1; // Basic verified
    return VendorTier.TIER_0; // Unverified
  }

  /**
   * Get a complete tier breakdown for a vendor, including current tier, total points,
   * next tier info, verification history, and tier benefits.
   *
   * @param vendorId - Vendor profile ID
   * @returns Breakdown object with current_tier, total_points, next_tier, points_to_next_tier, verifications, tier_benefits
   * @throws {AppError} 404 — Vendor profile not found
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
   * Get the next tier above the current one, or null if already at maximum (TIER_4).
   *
   * @param currentTier - Current vendor tier
   * @returns The next VendorTier, or null if already at max
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
   * Calculate the points required to reach the next tier.
   * Returns null if already at the maximum tier (TIER_4, 30+ points).
   *
   * @param currentPoints - Total accumulated verification points
   * @returns Points needed for next tier, or null at max
   */
  private static getPointsToNextTier(currentPoints: number): number | null {
    if (currentPoints >= 30) return null; // Already at max tier
    if (currentPoints >= 20) return 30 - currentPoints; // To TIER_4
    if (currentPoints >= 15) return 20 - currentPoints; // To TIER_3
    if (currentPoints >= 8) return 15 - currentPoints; // To TIER_2
    return 8 - currentPoints; // To TIER_1
  }

  /**
   * Get the feature benefits associated with a given tier.
   * Includes badge, max products, video posting, search visibility, order limit, and support priority.
   *
   * @param tier - The vendor tier to look up
   * @returns Benefits object with badge, max_products, can_post_videos, featured_in_search, order_limit, support_priority
   */
  private static getTierBenefits(tier: VendorTier) {
    const benefits: Record<
      VendorTier,
      {
        badge: string | null;
        max_products: number | null;
        can_post_videos: boolean;
        featured_in_search: boolean;
        order_limit: number | null;
        support_priority: string;
      }
    > = {
      [VendorTier.TIER_0]: {
        badge: null,
        max_products: 5,
        can_post_videos: false,
        featured_in_search: false,
        order_limit: 50000,
        support_priority: 'standard',
      },
      [VendorTier.TIER_1]: {
        badge: '🟢 NOVA Verified',
        max_products: 20,
        can_post_videos: true,
        featured_in_search: false,
        order_limit: 200000,
        support_priority: 'standard',
      },
      [VendorTier.TIER_2]: {
        badge: '🔵 Business Verified',
        max_products: 50,
        can_post_videos: true,
        featured_in_search: true,
        order_limit: 1000000,
        support_priority: 'high',
      },
      [VendorTier.TIER_3]: {
        badge: '🟣 Elite Seller',
        max_products: 100,
        can_post_videos: true,
        featured_in_search: true,
        order_limit: 5000000,
        support_priority: 'premium',
      },
      [VendorTier.TIER_4]: {
        badge: '🏆 Premium Verified',
        max_products: null,
        can_post_videos: true,
        featured_in_search: true,
        order_limit: null,
        support_priority: 'vip',
      },
    };

    return benefits[tier];
  }
}
