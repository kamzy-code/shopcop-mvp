import { NextFunction, Request, Response } from 'express';
import { AdminProfileService } from '../../services/admin/adminProfileService.js';
import { adminProfileSchema } from '../../validators/adminProfileValidator.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { AppError } from '@middleware/errorHandler.js';
import { adminLogger } from '@utils/logger.js';

export class AdminProfileController {
  /**
   * GET /api/v1/admin/profile
   * Returns the admin's own profile (null if not yet created).
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await AdminProfileService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      adminLogger.error('Error fetching admin profile', {
        action: 'getProfile',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/profile
   * Create or update the admin's own profile.
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      const parsed = adminProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parseZodErrors(parsed.error.issues), 400);
      }

      const profile = await AdminProfileService.upsertProfile(userId, parsed.data);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      adminLogger.error('Error updating admin profile', {
        action: 'updateProfile',
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
