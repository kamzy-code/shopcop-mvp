import { NextFunction, Request, Response } from 'express';
import { AdminVerificationService } from '@services/admin/adminVerificationService.js';
import { TierCalculationService } from '@services/tierCalculationService.js';
import { CloudinaryService } from '@services/cloudinaryService.js';
import {
  approveVerificationSchema,
  rejectVerificationSchema,
} from '../../validators/adminVerificationValidator.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { VerificationStatus, VerificationType } from '../../generated/prisma/client.js';

export class AdminVerificationController {
  /**
   * GET /api/v1/admin/verifications
   * Get all verifications with optional filtering, pagination, and sorting.
   * Restricted to ADMIN role.
   *
   * @param req.query.status - Filter by verification status (PENDING, APPROVED, REJECTED)
   * @param req.query.type - Filter by verification type (NIN, CAC, SMEDAN, ADDRESS)
   * @param req.query.vendorId - Filter by vendor ID
   * @param req.query.page - Page number for pagination (default: 1)
   * @param req.query.limit - Results per page (default: 20)
   * @param req.query.sortBy - Sort field (submitted_at, reviewed_at)
   * @param req.query.sortOrder - Sort direction (asc, desc)
   * @returns 200 `{ success, data: verifications[], pagination }`
   * @throws {AppError} 500 — Database query failure
   */
  static async getAllVerifications(req: Request, res: Response, next: NextFunction) {
    const action = 'getAllVerifications';
    const { status, type, vendorId, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
      status: status as VerificationStatus | undefined,
      type: type as VerificationType | undefined,
      vendorId: vendorId as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as 'submitted_at' | 'reviewed_at' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    };

    try {
      const result = await AdminVerificationService.getAllVerifications(filters);

      res.status(200).json({
        success: true,
        data: result,
       message: 'Verifications fetched successfuly by admin'
      });

      adminLogger.info('Verifications fetched', { action, ...filters });
    } catch (error) {
      adminLogger.error('Failed to fetch verifications', {
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verifications/:id
   * Get full verification details for admin review.
   * Includes vendor profile, user info, and approved verifications.
   *
   * @param req.params.id - Verification ID
   * @returns 200 `{ success, data: verification }`
   * @throws {AppError} 404 — Verification not found
   */
  static async getVerificationDetails(req: Request, res: Response, next: NextFunction) {
    const action = 'getVerificationDetails';
    const { id } = req.params;

    try {
      const verification = await AdminVerificationService.getVerificationDetails(id as string);

      res.status(200).json({
        success: true,
        data: verification,
      });

      adminLogger.info('Verification details fetched', { action, verificationId: id });
    } catch (error) {
      adminLogger.error('Failed to fetch verification details', {
        action,
        verificationId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/verifications/:id/approve
   * Approve a pending verification. Updates vendor tier based on accumulated points.
   *
   * @param req.params.id - Verification ID to approve
   * @param req.body.admin_notes - Internal admin notes (optional, max 500 chars)
   * @param req.user.userId - Admin user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: { verification, new_tier }, message }`
   * @throws {AppError} 400 — Verification not in PENDING status or validation failure
   * @throws {AppError} 401 — No authenticated user on the request
   * @throws {AppError} 404 — Verification not found
   */
  static async approveVerification(req: Request, res: Response, next: NextFunction) {
    const action = 'approveVerification';
    const { id } = req.params;

    if (!req.user) {
      adminLogger.warn('Authentication required', { action });
      throw new AppError('Authentication required', 401);
    }

    const adminId = req.user.userId;

    const parsed = approveVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      adminLogger.warn('Validation failed', { action, adminId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const result = await AdminVerificationService.approveVerification(
        id as string,
        adminId,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: result,
        message: `Verification approved successfully. Vendor tier updated to ${result.new_tier}.`,
      });

      adminLogger.info('Verification approved', {
        action,
        adminId,
        verificationId: id,
        newTier: result.new_tier,
      });
    } catch (error) {
      adminLogger.error('Failed to approve verification', {
        action,
        adminId,
        verificationId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/verifications/:id/reject
   * Reject a pending verification with a required reason.
   *
   * @param req.params.id - Verification ID to reject
   * @param req.body.rejection_reason - Reason for rejection (10-500 chars)
   * @param req.body.admin_notes - Internal admin notes (optional, max 500 chars)
   * @param req.user.userId - Admin user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Verification not in PENDING status or validation failure
   * @throws {AppError} 401 — No authenticated user on the request
   * @throws {AppError} 404 — Verification not found
   */
  static async rejectVerification(req: Request, res: Response, next: NextFunction) {
    const action = 'rejectVerification';
    const { id } = req.params;

    if (!req.user) {
      adminLogger.warn('Authentication required', { action });
      throw new AppError('Authentication required', 401);
    }

    const adminId = req.user.userId;

    const parsed = rejectVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      adminLogger.warn('Validation failed', { action, adminId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await AdminVerificationService.rejectVerification(
        id as string,
        adminId,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'Verification rejected. Vendor has been notified.',
      });

      adminLogger.info('Verification rejected', {
        action,
        adminId,
        verificationId: id,
      });
    } catch (error) {
      adminLogger.error('Failed to reject verification', {
        action,
        adminId,
        verificationId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verifications/stats
   * Get verification dashboard statistics (counts by status, pending by type, recent approvals).
   *
   * @returns 200 `{ success, data: { summary, pending_by_type, recent_approvals } }`
   * @throws {AppError} 500 — Database query failure
   */
  static async getVerificationStats(req: Request, res: Response, next: NextFunction) {
    const action = 'getVerificationStats';

    try {
      const stats = await AdminVerificationService.getVerificationStats();

      res.status(200).json({
        success: true,
        data: stats,
      });

      adminLogger.info('Verification stats fetched', { action });
    } catch (error) {
      adminLogger.error('Failed to fetch verification stats', {
        action,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/verifications/:id/signed-url
   * Get time-bound signed URLs for private Cloudinary verification documents.
   * For NIN: returns both front_url and back_url (back_url is null if not available).
   * For CAC/SMEDAN/ADDRESS: returns a single url.
   *
   * @param req.params.id - Verification ID
   * @returns 200 `{ success, data: { front_url, back_url } }` for NIN
   * @returns 200 `{ success, data: { url } }` for other types
   * @throws {AppError} 404 — Verification or document not found
   */
  static async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    const action = 'getSignedUrl';
    const { id } = req.params;

    try {
      const verification = await AdminVerificationService.getVerificationDetails(id as string);

      if (verification.type === 'NIN') {
        if (!verification.govt_id_front_public_id) {
          adminLogger.warn('No NIN front document public_id found', { action, verificationId: id });
          throw new AppError('No document found for this verification', 404);
        }

        const frontUrl = CloudinaryService.getSignedUrl(verification.govt_id_front_public_id);
        let backUrl: string | null = null;

        if (verification.govt_id_back_public_id) {
          backUrl = CloudinaryService.getSignedUrl(verification.govt_id_back_public_id);
        }

        res.status(200).json({
          success: true,
          data: { front_url: frontUrl, back_url: backUrl },
        });

        adminLogger.info('Signed URLs generated for NIN verification', {
          action,
          verificationId: id,
          hasBackImage: !!backUrl,
        });
        return;
      }

      let publicId: string | null = null;

      if (verification.type === 'CAC') {
        publicId = verification.cac_certificate_public_id;
      } else if (verification.type === 'SMEDAN') {
        publicId = verification.smedan_certificate_public_id;
      } else if (verification.type === 'ADDRESS') {
        publicId = verification.address_document_public_id;
      }

      if (!publicId) {
        adminLogger.warn('No document public_id found', {
          action,
          verificationId: id,
          type: verification.type,
        });
        throw new AppError('No document found for this verification', 404);
      }

      const url = CloudinaryService.getSignedUrl(publicId);

      res.status(200).json({
        success: true,
        data: { url },
      });

      adminLogger.info('Signed URL generated', {
        action,
        verificationId: id,
        type: verification.type,
      });
    } catch (error) {
      adminLogger.error('Failed to generate signed URL', {
        action,
        verificationId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/vendors/:vendorId/tier-breakdown
   * Get a vendor's complete tier breakdown for admin review.
   * Includes current tier, total points, next tier info, verification history, and tier benefits.
   *
   * @param req.params.vendorId - Vendor profile ID
   * @returns 200 `{ success, data: { current_tier, total_points, next_tier, points_to_next_tier, verifications, tier_benefits } }`
   * @throws {AppError} 404 — Vendor profile not found
   */
  static async getVendorTierBreakdown(req: Request, res: Response, next: NextFunction) {
    const action = 'getVendorTierBreakdown';
    const { vendorId } = req.params;

    try {
      const breakdown = await TierCalculationService.getTierBreakdown(vendorId as string);

      res.status(200).json({
        success: true,
        data: breakdown,
      });

      adminLogger.info('Vendor tier breakdown fetched', { action, vendorId });
    } catch (error) {
      adminLogger.error('Failed to fetch vendor tier breakdown', {
        action,
        vendorId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
