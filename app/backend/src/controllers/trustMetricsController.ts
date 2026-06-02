import { NextFunction, Request, Response } from 'express';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import { trustMetricsLogger } from '@utils/logger.js';

export class TrustMetricsController {
  static async getTrustMetrics(req: Request, res: Response, next: NextFunction) {
    const action = 'getTrustMetrics';
    const userId = req.user!.userId;

    try {
      const metrics = await TrustMetricsService.getVendorTrustMetricsByUserId(userId);

      trustMetricsLogger.info('Trust metrics fetched', { action, userId });

      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      trustMetricsLogger.error('Failed to fetch trust metrics', { action, userId, error });
      next(error);
    }
  }
}
