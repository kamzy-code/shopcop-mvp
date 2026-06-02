import { NextFunction, Request, Response } from 'express';
import { PublicProfileService } from '@services/publicProfileService.js';
import { publicProfileLogger } from '@utils/logger.js';

export class PublicProfileController {
  static async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    const action = 'getPublicProfile';
    const slug = req.params.slug as string;

    const reviewPage = Math.max(1, parseInt(req.query.review_page as string) || 1);
    const reviewLimit = Math.min(50, Math.max(1, parseInt(req.query.review_limit as string) || 10));
    const productPage = Math.max(1, parseInt(req.query.product_page as string) || 1);
    const productLimit = Math.min(50, Math.max(1, parseInt(req.query.product_limit as string) || 20));

    try {
      const result = await PublicProfileService.getPublicProfile(
        slug,
        reviewPage,
        reviewLimit,
        productPage,
        productLimit
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      publicProfileLogger.error('Failed to fetch public profile', { action, slug, error });
      next(error);
    }
  }
}
