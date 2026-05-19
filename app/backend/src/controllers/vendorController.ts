import { NextFunction, Request, Response } from 'express';
import { VendorProfileService } from '@services/vendorProfileService.js';
import { personalInfoSchema, businessInfoSchema } from '../validators/vendorProfileValidator.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class VendorProfileController {
  /**
   * POST /api/v1/profile/personal-info
   * Update personal information (Step 1)
   */
  static async updatePersonalInfo(req: Request, res: Response, next: NextFunction) {
    const action = 'updatePersonalInfo';
    const userId = req.user!.userId;

    const parsed = personalInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Invalid personal info input', { action, userId, issues: parsed.error.issues });
      throw new AppError(`Invalid personal info input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const profile = await VendorProfileService.updatePersonalInfo(userId, parsed.data);

      vendorLogger.info('Personal info updated successfully', {
        action,
        userId,
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Personal information updated successfully',
      });
    } catch (error) {
      vendorLogger.error('Failed to update personal info', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/business-info
   * Update business information (Step 2)
   */
  static async updateBusinessInfo(req: Request, res: Response, next: NextFunction) {
    const action = 'updateBusinessInfo';
    const userId = req.user!.userId;

    const parsed = businessInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      vendorLogger.warn('Invalid business info input', { action, userId, issues: parsed.error.issues });
      throw new AppError(`Invalid business info input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const profile = await VendorProfileService.updateBusinessInfo(userId, parsed.data);

      vendorLogger.info('Business info updated successfully', {
        action,
        userId,
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Business information updated successfully',
      });
    } catch (error) {
      vendorLogger.error('Failed to update business info', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/profile
   * Get vendor profile
   */
  static async getVendorProfile(req: Request, res: Response, next: NextFunction) {
    const action = 'getVendorProfile';
    const userId = req.user!.userId;

    try {
      const profile = await VendorProfileService.getVendorProfileWithVerifications(userId);

      if (!profile) {
        vendorLogger.warn('Vendor profile not found', { action, userId });
        throw new AppError('Vendor profile not found', 404);
      }

      vendorLogger.info('Get vendor profile successful', { action, userId });
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      vendorLogger.error('Failed to get vendor profile', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/profile/completeness
   * Get profile completeness breakdown
   */
  static async getProfileCompleteness(req: Request, res: Response, next: NextFunction) {
    const action = 'getProfileCompleteness';
    const userId = req.user!.userId;

    try {
      const breakdown = await VendorProfileService.getProfileCompletenessBreakdown(userId);

      vendorLogger.info('Get profile completeness successful', {
        action,
        userId,
        profileCompleteness: breakdown.total_completeness,
      });

      res.status(200).json({ success: true, data: breakdown });
    } catch (error) {
      vendorLogger.error('Failed to get profile completeness', {
        action,
        userId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}
