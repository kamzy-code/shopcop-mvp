import { prisma } from '@config/prisma.js';
import { reviewLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { ModerationStatus, TransactionStatus } from '../generated/prisma/enums.js';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import type { CreateReviewInput, EditReviewTextInput, ReviewData, ReviewSummary } from '../types/reviewTypes.js';

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
        buyer_id: data.buyer_id ?? null,
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

  static async editReviewText(data: EditReviewTextInput): Promise<ReviewData> {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: data.tracking_token },
      select: {
        id: true,
        review: {
          select: {
            id: true,
            overall_rating: true,
            delivery_rating: true,
            response_rating: true,
            satisfaction_rating: true,
            buyer_name: true,
            review_text: true,
            created_at: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (!transaction.review) {
      throw new AppError('No review found for this transaction', 404);
    }

    const ageMs = Date.now() - transaction.review.created_at.getTime();
    if (ageMs > SEVEN_DAYS_MS) {
      throw new AppError('The 7-day edit window for this review has closed', 403);
    }

    const updated = await prisma.review.update({
      where: { id: transaction.review.id },
      data: { review_text: data.review_text ?? null },
    });

    reviewLogger.info('Review text edited', {
      action: 'editReviewText',
      reviewId: transaction.review.id,
    });

    return {
      id: updated.id,
      overall_rating: updated.overall_rating,
      delivery_rating: updated.delivery_rating,
      response_rating: updated.response_rating,
      satisfaction_rating: updated.satisfaction_rating,
      buyer_name: updated.buyer_name,
      review_text: updated.review_text,
      created_at: updated.created_at,
    };
  }

  static async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    minRating?: number,
    maxRating?: number
  ): Promise<{ reviews: ReviewData[]; summary: ReviewSummary }> {
    const where = {
      vendor_id: vendorId,
      moderation_status: ModerationStatus.APPROVED,
      ...(minRating !== undefined || maxRating !== undefined
        ? {
            overall_rating: {
              ...(minRating !== undefined ? { gte: minRating } : {}),
              ...(maxRating !== undefined ? { lte: maxRating } : {}),
            },
          }
        : {}),
    };
    // Summary (total + distribution + avg) always uses unfiltered data
    const summaryWhere = {
      vendor_id: vendorId,
      moderation_status: ModerationStatus.APPROVED,
    };

    const [reviews, filteredTotal, aggregation, distributionRows] = await Promise.all([
      // Paginated reviews use the rating-filtered where clause
      prisma.review.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      // Count also filtered (for pagination of the segment)
      prisma.review.count({ where }),
      // Summary avg + distribution always use unfiltered data
      prisma.review.aggregate({
        where: summaryWhere,
        _avg: { overall_rating: true },
      }),
      prisma.review.groupBy({
        by: ['overall_rating'],
        where: summaryWhere,
        _count: { overall_rating: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distributionRows) {
      distribution[row.overall_rating] = row._count.overall_rating;
    }

    const totalReviews = Object.values(distribution).reduce((a, b) => a + b, 0);

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
        total_reviews: totalReviews,         // always full count for UI segmentation chips
        filtered_total: filteredTotal,        // count matching the active segment
        distribution,
      },
    };
  }
}
