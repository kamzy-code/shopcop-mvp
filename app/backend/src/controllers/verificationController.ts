import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '@services/verificationService.js';
import {
  ninVerificationSchema,
  cacVerificationSchema,
  smedanVerificationSchema,
  addressVerificationSchema,
  resubmitVerificationSchema,
} from '../validators/verificationValidator.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { VendorProfileService } from '@services/vendorProfileService.js';

export class VerificationController {
  /**
   * POST /api/v1/verifications/nin
   * Submit NIN verification for identity verification.
   * Requires personal info to be completed first.
   *
   * @param req.body.nin_number - 11-digit NIN
   * @param req.body.nin_full_name - Full name on NIN slip
   * @param req.body.govt_id_front_url - Cloudinary URL of front ID image
   * @param req.body.govt_id_front_public_id - Cloudinary public ID of front ID image
   * @param req.body.govt_id_back_url - Cloudinary URL of back ID image (optional)
   * @param req.body.govt_id_back_public_id - Cloudinary public ID of back ID image (optional)
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 201 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Validation failure or personal info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — NIN verification already pending or approved
   */
  static async submitNINVerification(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'submitNINVerification';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    const parsed = ninVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Validation failed', { action, userId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await VerificationService.submitNINVerification(
        vendorProfile.id,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'NIN verification submitted successfully. Awaiting admin review.',
      });

      vendorLogger.info('NIN verification submitted', { action, userId });
    } catch (error) {
      vendorLogger.error('Failed to submit NIN verification', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/verifications/cac
   * Submit CAC business registration verification.
   * Requires business info to be completed first.
   *
   * @param req.body.cac_rc_number - CAC registration number
   * @param req.body.cac_company_type - Company type (e.g. SOLE_PROPRIETORSHIP, LIMITED_LIABILITY)
   * @param req.body.cac_certificate_url - Cloudinary URL of CAC certificate
   * @param req.body.cac_certificate_public_id - Cloudinary public ID of CAC certificate
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 201 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Validation failure or business info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — CAC verification already pending or approved
   */
  static async submitCACVerification(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'submitCACVerification';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    const parsed = cacVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Validation failed', { action, userId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await VerificationService.submitCACVerification(
        vendorProfile.id,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'CAC verification submitted successfully. Awaiting admin review.',
      });

      vendorLogger.info('CAC verification submitted', { action, userId });
    } catch (error) {
      vendorLogger.error('Failed to submit CAC verification', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/verifications/smedan
   * Submit SMEDAN registration verification.
   * Requires business info to be completed first.
   *
   * @param req.body.smedan_suin - SMEDAN Unique Identification Number
   * @param req.body.smedan_business_type - Business type (e.g. SOLE_PROPRIETORSHIP, LIMITED_LIABILITY)
   * @param req.body.smedan_certificate_url - Cloudinary URL of SMEDAN certificate
   * @param req.body.smedan_certificate_public_id - Cloudinary public ID of SMEDAN certificate
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 201 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Validation failure or business info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — SMEDAN verification already pending or approved
   */
  static async submitSMEDANVerification(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'submitSMEDANVerification';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    const parsed = smedanVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Validation failed', { action, userId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await VerificationService.submitSMEDANVerification(
        vendorProfile.id,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'SMEDAN verification submitted successfully. Awaiting admin review.',
      });

      vendorLogger.info('SMEDAN verification submitted', { action, userId });
    } catch (error) {
      vendorLogger.error('Failed to submit SMEDAN verification', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/verifications/address
   * Submit proof-of-address document for address verification.
   * Requires business info with street address to be completed first.
   *
   * @param req.body.address_document_url - Cloudinary URL of utility bill or address proof
   * @param req.body.address_document_public_id - Cloudinary public ID of address document
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 201 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Validation failure or business address info not complete
   * @throws {AppError} 404 — Vendor profile not found
   * @throws {AppError} 409 — Address verification already pending or approved
   */
  static async submitAddressVerification(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'submitAddressVerification';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    const parsed = addressVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Validation failed', { action, userId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await VerificationService.submitAddressVerification(
        vendorProfile.id,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'Address verification submitted successfully. Awaiting admin review.',
      });

      vendorLogger.info('Address verification submitted', { action, userId });
    } catch (error) {
      vendorLogger.error('Failed to submit address verification', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/verifications
   * Get all verifications for the authenticated vendor.
   *
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: verifications[] }`
   * @throws {AppError} 401 — No authenticated user on the request
   * @throws {AppError} 404 — Vendor profile not found
   */
  static async getMyVerifications(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    const action = 'getMyVerifications';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    try {
      const verifications = await VerificationService.getVendorVerifications(vendorProfile.id);

      res.status(200).json({ success: true, data: verifications });

      vendorLogger.info('Verifications fetched', { action, userId });
    } catch (error) {
      vendorLogger.error('Failed to fetch verifications', {
        action,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/verifications/:id
   * Get a specific verification by its ID.
   * Only returns the verification if it belongs to the authenticated vendor.
   *
   * @param req.params.id - Verification ID
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: verification }`
   * @throws {AppError} 401 — No authenticated user on the request
   * @throws {AppError} 403 — Verification belongs to a different vendor
   * @throws {AppError} 404 — Verification not found
   */
  static async getVerificationById(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const action = 'getVerificationById';

    try {
      const verification = await VerificationService.getVerificationById(id);

      if (!verification) {
        vendorLogger.warn('Verification not found', { action, verificationId: id, userId });
        throw new AppError('Verification not found', 404);
      }

      if (verification.vendor.user_id !== userId) {
        vendorLogger.warn('Access denied to verification', { action, verificationId: id, userId });
        throw new AppError('Access denied', 403);
      }

      res.status(200).json({ success: true, data: verification });

      vendorLogger.info('Verification fetched', { action, verificationId: id, userId });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      vendorLogger.error('Failed to fetch verification', {
        action,
        verificationId: id,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/verifications/:id/resubmit
   * Resubmit a rejected verification with updated document(s).
   * Only verifications in REJECTED status can be resubmitted.
   *
   * @param req.params.id - Verification ID to resubmit
   * @param req.body - Partial verification data (fields vary by type; at least one required)
   * @param req.user.userId - Authenticated user's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: verification, message }`
   * @throws {AppError} 400 — Validation failure, verification not in REJECTED status, or no fields provided
   * @throws {AppError} 404 — Vendor profile or verification not found
   */
  static async resubmitVerification(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const action = 'resubmitVerification';

    const vendorProfile = await VendorProfileService.getVendorProfile(userId);
    if (!vendorProfile) {
      vendorLogger.warn('Vendor profile not found', { action, userId });
      throw new AppError('Vendor profile not found', 404);
    }

    const parsed = resubmitVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Validation failed', { action, userId, errors: parsed.error.issues });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const verification = await VerificationService.resubmitVerification(
        id,
        vendorProfile.id,
        parsed.data
      );

      res.status(201).json({
        success: true,
        data: verification,
        message: 'Verification resubmitted successfully. Awaiting admin review.',
      });

      vendorLogger.info('Verification resubmitted', { action, verificationId: id, userId });
    } catch (error) {
      vendorLogger.error('Failed to resubmit verification', {
        action,
        verificationId: id,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
