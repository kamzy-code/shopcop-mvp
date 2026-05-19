import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { VerificationStatus, VerificationType } from '../../generated/prisma/client.js';
import { TierCalculationService } from '../tierCalculationService.js';

// ============================================
// TYPES
// ============================================

interface ApproveVerificationInput {
  admin_notes?: string;
}

interface RejectVerificationInput {
  rejection_reason: string;
  admin_notes?: string;
}

// ============================================
// ADMIN VERIFICATION SERVICE
// ============================================

export class AdminVerificationService {
  /**
   * Get all verifications with filters
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
   * Get verification details by ID (for admin review)
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
   * Approve verification
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
   * Reject verification
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
   * Get verification statistics (admin dashboard)
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
   * Log admin action for audit trail
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
