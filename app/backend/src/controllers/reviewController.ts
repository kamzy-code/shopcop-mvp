import { NextFunction, Request, Response } from 'express';
import { ReviewService } from '@services/reviewService.js';
import { createReviewSchema, editReviewTextSchema } from '@validators/reviewValidator.js';
import { reviewLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class ReviewController {
  static async createReview(req: Request, res: Response, next: NextFunction) {
    const action = 'createReview';

    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      reviewLogger.warn('Invalid review input', {
        action,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const review = await ReviewService.createReview(parsed.data);
      reviewLogger.info('Review created successfully', { action, reviewId: review.id });
      res.status(201).json({
        success: true,
        data: review,
        message: 'Review submitted successfully',
      });
    } catch (error) {
      reviewLogger.error('Failed to create review', { action, error });
      next(error);
    }
  }

  static async editReviewText(req: Request, res: Response, next: NextFunction) {
    const action = 'editReviewText';

    const parsed = editReviewTextSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const review = await ReviewService.editReviewText(parsed.data);
      reviewLogger.info('Review text updated', { action, reviewId: review.id });
      res.status(200).json({
        success: true,
        data: review,
        message: 'Review updated successfully',
      });
    } catch (error) {
      reviewLogger.error('Failed to edit review text', { action, error });
      next(error);
    }
  }

  static async getVendorReviews(req: Request, res: Response, next: NextFunction) {
    const action = 'getVendorReviews';
    const vendorId = req.params.vendorId as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const minRatingRaw = parseInt(req.query.min_rating as string);
    const maxRatingRaw = parseInt(req.query.max_rating as string);
    const minRating = !isNaN(minRatingRaw) && minRatingRaw >= 1 && minRatingRaw <= 5 ? minRatingRaw : undefined;
    const maxRating = !isNaN(maxRatingRaw) && maxRatingRaw >= 1 && maxRatingRaw <= 5 ? maxRatingRaw : undefined;

    try {
      const result = await ReviewService.getVendorReviews(vendorId, page, limit, minRating, maxRating);
      const total = result.summary.total_reviews;
      res.status(200).json({
        success: true,
        data: result.reviews,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        summary: result.summary,
      });
    } catch (error) {
      reviewLogger.error('Failed to fetch vendor reviews', { action, vendorId, error });
      next(error);
    }
  }
}
