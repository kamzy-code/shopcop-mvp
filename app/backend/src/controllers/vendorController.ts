import { NextFunction, Request, Response } from 'express';
import { VendorProfileService } from '@services/vendorProfileService.js';
import { personalInfoSchema, businessInfoSchema } from '../validators/vendorProfileValidator.js';
import { vendorLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';

export class VendorProfileController {
  /**
   * POST /api/v1/profile/personal-info
   * Update personal information (Step 1)
   */
  static async updatePersonalInfo(req: Request, res: Response, next: NextFunction) {
    const userId = req.user!.userId;
    try {
      // Validate input
      const validatedData = personalInfoSchema.safeParse(req.body);

      if (!validatedData.success) {
        const errorMessage = validatedData.error.issues
          .map((issue) => {
            const path = issue.path.length ? issue.path.join('.') : 'body';
            return `${path}: ${issue.message}`;
          })
          .join('; ');

        vendorLogger.warn('Invalid personal info input', {
          action: 'updatePersonalInfo',
          userId,
          issues: validatedData.error.issues,
        });

        throw new AppError(`Invalid personal info input: ${errorMessage}`, 400);
      }

      // Update profile
      const profile = await VendorProfileService.updatePersonalInfo(userId, validatedData.data);

      vendorLogger.info('Personal info updated successfully', {
        userId,
        action: 'updatePersonalInfo',
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Personal information updated successfully',
      });
      return;
    } catch (error) {
      vendorLogger.error(`Update personal info error`, {
        action: 'updatePersonalInfo',
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
    const userId = req.user!.userId;
    try {
      // Validate input
      const validatedData = businessInfoSchema.safeParse(req.body);

      if (!validatedData.success) {
        const errorMessage = validatedData.error.issues
          .map((issue) => {
            const path = issue.path.length ? issue.path.join('.') : 'body';
            return `${path}: ${issue.message}`;
          })
          .join('; ');

        vendorLogger.warn('Invalid business info input', {
          action: 'updateBusinessInfo',
          userId,
          issues: validatedData.error.issues,
        });

        throw new AppError(`Invalid business info input: ${errorMessage}`, 400);
      }

      // Update profile
      const profile = await VendorProfileService.updateBusinessInfo(userId, validatedData.data);

      vendorLogger.info('Business info updated sucessfully', {
        action: 'updateBusinessInfo',
        userId,
        profileCompleteness: profile.profile_completeness,
      });

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Business information updated successfully',
      });
      return;
    } catch (error) {
      vendorLogger.error(`Update business info error`, {
        action: 'updateBusinessInfo',
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
    const userId = req.user!.userId;
    try {
      const profile = await VendorProfileService.getVendorProfile(userId);

      if (!profile) {
        vendorLogger.warn(`Vendor profile not found for user: ${userId}`, {
          action: 'getVendorProfile',
          userId,
        });
        throw new AppError(`Vendor profile not found for user: ${userId}`, 404);
      }

      vendorLogger.info('Get vendor profile successful', {
        action: 'getVendorprofile',
        userId,
      });
      res.status(200).json({
        success: true,
        data: profile,
      });
      return;
    } catch (error) {
      vendorLogger.error(`Get vendor profile error`, {
        action: 'getVendorProfile',
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
    const userId = req.user!.userId;
    try {
      const breakdown = await VendorProfileService.getProfileCompletenessBreakdown(userId);

      vendorLogger.info('Get profile completeness successful', {
        action: 'getProfileCompleteness',
        userId,
        profileCompleteness: breakdown.total_completeness,
      });

      res.status(200).json({
        success: true,
        data: breakdown,
      });
      return;
    } catch (error) {
      vendorLogger.error(`Get profile completeness error`, {
        action: 'getProfileCompleteness',
        error: error instanceof AppError ? error.message : error,
      });

      next(error);
    }
  }
}
