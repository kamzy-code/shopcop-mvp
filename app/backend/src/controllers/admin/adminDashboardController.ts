import { NextFunction, Request, Response } from 'express';
import { AdminDashboardService } from '@services/admin/adminDashboardService.js';
import { adminLogger } from '@utils/logger.js';

export class AdminDashboardController {
  /**
   * GET /api/v1/admin/dashboard/stats
   * Get aggregated platform statistics for the admin dashboard.
   * Includes user counts, verification summary, vendor tier distribution, and recent activity.
   * Restricted to ADMIN role.
   *
   * @returns 200 `{ success, data: { users, verifications, vendors, recent_activity } }`
   * @throws {AppError} 500 — Database query failure
   */
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    const action = 'getDashboardStats';
    const adminId = req.user!.userId;

    try {
      const stats = await AdminDashboardService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
      });

      adminLogger.info('Dashboard stats fetched', { action, adminId });
    } catch (error) {
      adminLogger.error('Failed to fetch dashboard stats', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
