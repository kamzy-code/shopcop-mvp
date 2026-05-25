import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { VerificationStatus, UserRole, VendorTier } from '../../generated/prisma/client.js';

// ============================================
// ADMIN DASHBOARD SERVICE
// ============================================

export class AdminDashboardService {
  /**
   * Aggregate platform-wide statistics for the admin dashboard.
   * All queries run in parallel via Promise.all for performance.
   *
   * @returns Dashboard stats object with user counts, verification summary,
   *          vendor tier distribution, and recent admin activity
   */
  static async getDashboardStats() {
    const action = 'getDashboardStats';
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const [
        totalUsers,
        vendorCount,
        buyerCount,
        adminCount,
        activeUsers,
        inactiveUsers,
        newLast7Days,
        newLast30Days,
        totalPending,
        totalApproved,
        totalRejected,
        pendingByType,
        tierDistribution,
        vendorsWithBusinessInfo,
        vendorsWithPersonalInfo,
        recentActivity,
      ] = await Promise.all([
        // User counts
        prisma.user.count(),
        prisma.user.count({ where: { role: UserRole.VENDOR } }),
        prisma.user.count({ where: { role: UserRole.BUYER } }),
        prisma.user.count({ where: { role: UserRole.ADMIN } }),
        prisma.user.count({ where: { is_active: true } }),
        prisma.user.count({ where: { is_active: false } }),
        prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } }),
        prisma.user.count({ where: { created_at: { gte: thirtyDaysAgo } } }),

        // Verification counts
        prisma.vendorVerification.count({ where: { status: VerificationStatus.PENDING } }),
        prisma.vendorVerification.count({ where: { status: VerificationStatus.APPROVED } }),
        prisma.vendorVerification.count({ where: { status: VerificationStatus.REJECTED } }),
        prisma.vendorVerification.groupBy({
          by: ['type'],
          where: { status: VerificationStatus.PENDING },
          _count: true,
        }),

        // Vendor breakdowns
        prisma.vendorProfile.groupBy({
          by: ['current_tier'],
          _count: true,
        }),
        prisma.vendorProfile.count({ where: { business_info_complete: true } }),
        prisma.vendorProfile.count({ where: { personal_info_complete: true } }),

        // Recent admin activity (last 10 entries)
        prisma.adminActivityLog.findMany({
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            admin: {
              select: { id: true, email: true, name: true },
            },
          },
        }),
      ]);

      adminLogger.info('Dashboard stats fetched', {
        action,
        totalUsers,
        totalPending,
        totalApproved,
        totalRejected,
      });

      return {
        users: {
          total: totalUsers,
          by_role: {
            [UserRole.VENDOR]: vendorCount,
            [UserRole.BUYER]: buyerCount,
            [UserRole.ADMIN]: adminCount,
          },
          active: activeUsers,
          inactive: inactiveUsers,
          new_last_7_days: newLast7Days,
          new_last_30_days: newLast30Days,
        },
        verifications: {
          total_pending: totalPending,
          total_approved: totalApproved,
          total_rejected: totalRejected,
          pending_by_type: pendingByType.map((item) => ({
            type: item.type,
            count: item._count,
          })),
        },
        vendors: {
          tier_distribution: tierDistribution.map((item) => ({
            tier: item.current_tier as VendorTier,
            count: item._count,
          })),
          with_business_info: vendorsWithBusinessInfo,
          with_personal_info: vendorsWithPersonalInfo,
        },
        recent_activity: recentActivity,
      };
    } catch (error) {
      adminLogger.error('Failed to fetch dashboard stats', {
        action,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
