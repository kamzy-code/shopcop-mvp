import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { VerificationStatus, VerificationType } from '../../generated/prisma/client.js';
import { TierCalculationService } from '../tierCalculationService.js';

// ============================================
// TYPES
// ============================================

/** Input for approving a verification: optional admin notes. */
interface ApproveVerificationInput {
  admin_notes?: string;
}

/** Input for rejecting a verification: required rejection reason and optional admin notes. */
interface RejectVerificationInput {
  rejection_reason: string;
  admin_notes?: string;
}

// ============================================
// ADMIN VERIFICATION SERVICE
// ============================================

export class AdminVerificationService {
  /**
   * Get all verifications with optional filtering by status/type/vendor, pagination, and sorting.
   * Includes vendor user email. Pending verifications are sorted oldest-first by default.
   *
   * @param filters.status - Filter by verification status
   * @param filters.type - Filter by verification type
   * @param filters.vendorId - Filter by vendor profile ID
   * @param filters.page - Page number (default: 1)
   * @param filters.limit - Results per page (default: 20)
   * @param filters.sortBy - Sort field: submitted_at or reviewed_at
   * @param filters.sortOrder - Sort direction: asc or desc
   * @returns Object with verifications array and pagination info
   */
  static async getAllVerifications(filters: {
    status?: VerificationStatus;
    type?: VerificationType;
    vendorId?: string;
    page?: number;
    limit?: number;
    sortBy?: 'submitted_at' | 'reviewed_at';
    sortOrder?: 'asc' | 'desc';
  }) {
    const action = 'getAllVerifications';
    const {
      status,
      type,
      vendorId,
      page = 1,
      limit = 20,
      sortBy = 'submitted_at',
      sortOrder = 'desc',
    } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (vendorId) where.vendor_id = vendorId;

    const orderBy =
      status === VerificationStatus.PENDING
        ? { submitted_at: 'asc' as const }
        : { [sortBy]: sortOrder };

    try {
      const [verifications, total] = await Promise.all([
        prisma.vendorVerification.findMany({
          where,
          include: {
            vendor: {
              include: {
                user: {
                  select: { email: true },
                },
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.vendorVerification.count({ where }),
      ]);

      adminLogger.info('Verifications fetched', { action, status, type, vendorId, total });

      return {
        verifications,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      adminLogger.error('Failed to fetch verifications', {
        action,
        status,
        type,
        vendorId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get full verification details for admin review.
   * Includes vendor profile, user info, and all approved verifications.
   *
   * @param verificationId - Verification record ID
   * @returns Verification with included vendor, user, and approved verifications
   * @throws {AppError} 404 — Verification not found
   */
  static async getVerificationDetails(verificationId: string) {
    const action = 'getVerificationDetails';

    const verification = await prisma.vendorVerification.findUnique({
      where: { id: verificationId },
      include: {
        vendor: {
          include: {
            user: {
              select: { id: true, email: true, created_at: true },
            },
            verifications: {
              where: { status: VerificationStatus.APPROVED },
            },
          },
        },
      },
    });

    if (!verification) {
      adminLogger.warn('Verification not found for details', { action, verificationId });
      throw new AppError('Verification not found', 404);
    }

    adminLogger.info('Verification details fetched', { action, verificationId });

    return verification;
  }

  /**
   * Approve a pending verification. Updates the vendor's tier based on accumulated points
   * and logs the admin action for audit trail.
   *
   * @param verificationId - Verification record ID to approve
   * @param adminId - Admin user's ID
   * @param data - ApproveVerificationInput with optional admin_notes
   * @returns Object with the approved verification and the new vendor tier
   * @throws {AppError} 400 — Verification is not in PENDING status
   * @throws {AppError} 404 — Verification not found
   */
  static async approveVerification(
    verificationId: string,
    adminId: string,
    data: ApproveVerificationInput
  ) {
    const action = 'approveVerification';

    const verification = await prisma.vendorVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      adminLogger.warn('Verification not found for approval', { action, verificationId, adminId });
      throw new AppError('Verification not found', 404);
    }

    if (verification.status !== VerificationStatus.PENDING) {
      adminLogger.warn('Cannot approve non-pending verification', {
        action,
        verificationId,
        adminId,
        currentStatus: verification.status,
      });
      throw new AppError(`Cannot approve verification with status: ${verification.status}`, 400);
    }

    try {
      const approvedVerification = await prisma.vendorVerification.update({
        where: { id: verificationId },
        data: {
          status: VerificationStatus.APPROVED,
          reviewed_by: adminId,
          reviewed_at: new Date(),
          approved_at: new Date(),
          admin_notes: data.admin_notes,
        },
        include: {
          vendor: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
        },
      });

      const newTier = await TierCalculationService.calculateAndUpdateTier(verification.vendor_id);

      await this.logAdminAction(adminId, 'verification_approved', verificationId, {
        verification_type: verification.type,
        vendor_id: verification.vendor_id,
        points_awarded: verification.points_value,
        new_tier: newTier,
      });

      adminLogger.info('Verification approved', {
        action,
        verificationId,
        adminId,
        verificationType: verification.type,
        newTier,
      });

      return { verification: approvedVerification, new_tier: newTier };
    } catch (error) {
      adminLogger.error('Failed to approve verification', {
        action,
        verificationId,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Reject a pending verification with a required reason.
   * Logs the admin action for audit trail.
   *
   * @param verificationId - Verification record ID to reject
   * @param adminId - Admin user's ID
   * @param data - RejectVerificationInput with required rejection_reason and optional admin_notes
   * @returns The rejected verification record
   * @throws {AppError} 400 — Verification is not in PENDING status
   * @throws {AppError} 404 — Verification not found
   */
  static async rejectVerification(
    verificationId: string,
    adminId: string,
    data: RejectVerificationInput
  ) {
    const action = 'rejectVerification';

    const verification = await prisma.vendorVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      adminLogger.warn('Verification not found for rejection', { action, verificationId, adminId });
      throw new AppError('Verification not found', 404);
    }

    if (verification.status !== VerificationStatus.PENDING) {
      adminLogger.warn('Cannot reject non-pending verification', {
        action,
        verificationId,
        adminId,
        currentStatus: verification.status,
      });
      throw new AppError(`Cannot reject verification with status: ${verification.status}`, 400);
    }

    try {
      const rejectedVerification = await prisma.vendorVerification.update({
        where: { id: verificationId },
        data: {
          status: VerificationStatus.REJECTED,
          reviewed_by: adminId,
          reviewed_at: new Date(),
          rejection_reason: data.rejection_reason,
          admin_notes: data.admin_notes,
        },
        include: {
          vendor: {
            include: {
              user: {
                select: { email: true },
              },
            },
          },
        },
      });

      await this.logAdminAction(adminId, 'verification_rejected', verificationId, {
        verification_type: verification.type,
        vendor_id: verification.vendor_id,
        rejection_reason: data.rejection_reason,
      });

      adminLogger.info('Verification rejected', {
        action,
        verificationId,
        adminId,
        verificationType: verification.type,
      });

      return rejectedVerification;
    } catch (error) {
      adminLogger.error('Failed to reject verification', {
        action,
        verificationId,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get verification dashboard statistics: counts by status, pending by type, and recent approvals.
   *
   * @returns Object with summary (total_pending/approved/rejected), pending_by_type array, and recent_approvals array
   */
  static async getVerificationStats() {
    const action = 'getVerificationStats';

    try {
      const [totalPending, totalApproved, totalRejected, pendingByType, recentApprovals] =
        await Promise.all([
          prisma.vendorVerification.count({ where: { status: VerificationStatus.PENDING } }),
          prisma.vendorVerification.count({ where: { status: VerificationStatus.APPROVED } }),
          prisma.vendorVerification.count({ where: { status: VerificationStatus.REJECTED } }),
          prisma.vendorVerification.groupBy({
            by: ['type'],
            where: { status: VerificationStatus.PENDING },
            _count: true,
          }),
          prisma.vendorVerification.findMany({
            where: { status: VerificationStatus.APPROVED },
            include: {
              vendor: {
                include: {
                  user: { select: { email: true } },
                },
              },
            },
            orderBy: { approved_at: 'desc' },
            take: 10,
          }),
        ]);

      adminLogger.info('Verification stats fetched', {
        action,
        totalPending,
        totalApproved,
        totalRejected,
      });

      return {
        summary: { total_pending: totalPending, total_approved: totalApproved, total_rejected: totalRejected },
        pending_by_type: pendingByType.map((item) => ({ type: item.type, count: item._count })),
        recent_approvals: recentApprovals,
      };
    } catch (error) {
      adminLogger.error('Failed to fetch verification stats', {
        action,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Log an admin action to the audit trail.
   * Failures are logged but not thrown to avoid disrupting the main operation.
   *
   * @param adminId - Admin user's ID
   * @param actionType - Action type identifier (e.g. verification_approved)
   * @param targetId - Target record ID
   * @param metadata - Additional context data for the audit log
   */
  private static async logAdminAction(
    adminId: string,
    actionType: string,
    targetId: string,
    metadata: Record<string, any>
  ) {
    try {
      await prisma.adminActivityLog.create({
        data: {
          admin_id: adminId,
          action_type: actionType,
          target_type: 'vendor_verification',
          target_id: targetId,
          after_data: metadata,
        },
      });
    } catch (error) {
      adminLogger.error('Failed to log admin action', {
        action: 'logAdminAction',
        adminId,
        actionType,
        targetId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
