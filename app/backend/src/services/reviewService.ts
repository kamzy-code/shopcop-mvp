import { prisma } from '@config/prisma.js';
import { reviewLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { TransactionStatus, ModerationStatus } from '../generated/prisma/enums.js';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import type { CreateReviewInput, ReviewData, ReviewSummary } from '../types/reviewTypes.js';

export class ReviewService {
  static async createReview(data: CreateReviewInput): Promise<ReviewData> {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: data.tracking_token },
      select: {
        id: true,
        vendor_id: true,
        status: true,
        buyer_email: true,
        review: { select: { id: true } },
      },
    });

    if (!transaction) {
      reviewLogger.warn('Transaction not found for review submission', {
        action: 'createReview',
        trackingToken: data.tracking_token,
      });
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      reviewLogger.warn('Transaction not completed, cannot review', {
        action: 'createReview',
        transactionId: transaction.id,
        status: transaction.status,
      });
      throw new AppError('You can only review completed transactions', 400);
    }

    if (transaction.review) {
      reviewLogger.warn('Review already exists for transaction', {
        action: 'createReview',
        transactionId: transaction.id,
      });
      throw new AppError('A review already exists for this transaction', 400);
    }

    const buyerName = data.buyer_name?.trim() || null;

    const review = await prisma.review.create({
      data: {
        transaction_id: transaction.id,
        vendor_id: transaction.vendor_id,
        buyer_name: buyerName,
        overall_rating: data.overall_rating,
        delivery_rating: data.delivery_rating ?? null,
        response_rating: data.response_rating ?? null,
        satisfaction_rating: data.satisfaction_rating ?? null,
        review_text: data.review_text?.trim() || null,
        moderation_status: ModerationStatus.APPROVED,
        approved_at: new Date(),
      },
    });

    reviewLogger.info('Review created', {
      action: 'createReview',
      reviewId: review.id,
      transactionId: transaction.id,
      vendorId: transaction.vendor_id,
    });

    TrustMetricsService.recalculateVendorTrustMetrics(transaction.vendor_id);

    return {
      id: review.id,
      overall_rating: review.overall_rating,
      delivery_rating: review.delivery_rating,
      response_rating: review.response_rating,
      satisfaction_rating: review.satisfaction_rating,
      buyer_name: review.buyer_name,
      review_text: review.review_text,
      created_at: review.created_at,
    };
  }

  static async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: ReviewData[]; summary: ReviewSummary; total: number }> {
    const where = {
      vendor_id: vendorId,
      moderation_status: 'APPROVED' as const,
    };

    const [reviews, total, aggregation] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { overall_rating: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allRatings = await prisma.review.findMany({
      where,
      select: { overall_rating: true },
    });
    for (const r of allRatings) {
      distribution[r.overall_rating] = (distribution[r.overall_rating] || 0) + 1;
    }

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        overall_rating: r.overall_rating,
        delivery_rating: r.delivery_rating,
        response_rating: r.response_rating,
        satisfaction_rating: r.satisfaction_rating,
        buyer_name: r.buyer_name,
        review_text: r.review_text,
        created_at: r.created_at,
      })),
      summary: {
        average_rating: aggregation._avg.overall_rating ?? 0,
        total_reviews: total,
        distribution,
      },
      total,
    };
  }
}
