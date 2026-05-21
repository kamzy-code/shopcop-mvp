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
   * Submit NIN verification
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
   * Submit CAC verification
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
   * Submit SMEDAN verification
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
   * Submit address verification
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
   * Get all verifications for current vendor
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
   * Get verification by ID
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
   * Resubmit rejected verification
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
