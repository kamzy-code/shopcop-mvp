import { prisma } from '@config/prisma.js';
import { reviewLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { ModerationStatus, OrderStatus } from '../generated/prisma/enums.js';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import type { CreateReviewInput, EditReviewInput, ReviewData, ReviewSummary } from '../types/reviewTypes.js';

export class ReviewService {
  static async createReview(data: CreateReviewInput): Promise<ReviewData> {
    const order = await prisma.order.findUnique({
      where: { tracking_token: data.tracking_token },
      select: {
        id: true,
        vendor_id: true,
        status: true,
        buyer_email: true,
        review: { select: { id: true } },
      },
    });

    if (!order) {
      reviewLogger.warn('Order not found for review submission', {
        action: 'createReview',
        trackingToken: data.tracking_token,
      });
      throw new AppError('Order not found', 404);
    }

    if (order.status !== OrderStatus.COMPLETED) {
      reviewLogger.warn('Order not completed, cannot review', {
        action: 'createReview',
        orderId: order.id,
        status: order.status,
      });
      throw new AppError('You can only review completed orders', 400);
    }

    if (order.review) {
      reviewLogger.warn('Review already exists for order', {
        action: 'createReview',
        orderId: order.id,
      });
      throw new AppError('A review already exists for this order', 400);
    }

    const buyerName = data.buyer_name?.trim() || null;

    const review = await prisma.review.create({
      data: {
        order_id: order.id,
        vendor_id: order.vendor_id,
        buyer_id: data.buyer_id ?? null,
        buyer_name: buyerName,
        overall_rating: data.overall_rating,
        delivery_rating: data.delivery_rating ?? null,
        response_rating: data.response_rating ?? null,
        satisfaction_rating: data.satisfaction_rating ?? null,
        review_text: data.review_text?.trim() || null,
        moderation_status: ModerationStatus.APPROVED,
        approved_at: new Date(),
        media: data.media?.length
          ? {
              create: data.media.map((m, i) => ({
                media_url: m.media_url,
                public_id: m.public_id ?? null,
                media_type: m.media_type ?? 'IMAGE',
                position: m.position ?? i,
              })),
            }
          : undefined,
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    reviewLogger.info('Review created', {
      action: 'createReview',
      reviewId: review.id,
      orderId: order.id,
      vendorId: order.vendor_id,
    });

    TrustMetricsService.recalculateVendorTrustMetrics(order.vendor_id);

    return {
      id: review.id,
      overall_rating: review.overall_rating,
      delivery_rating: review.delivery_rating,
      response_rating: review.response_rating,
      satisfaction_rating: review.satisfaction_rating,
      buyer_name: review.buyer_name,
      review_text: review.review_text,
      created_at: review.created_at,
      media: review.media?.length
        ? review.media.map((m) => ({
            id: m.id,
            media_url: m.media_url,
            public_id: m.public_id,
            media_type: m.media_type as 'IMAGE' | 'VIDEO',
            position: m.position,
          }))
        : undefined,
    };
  }

  static async editReview(data: EditReviewInput): Promise<ReviewData> {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const order = await prisma.order.findUnique({
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

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.review) {
      throw new AppError('No review found for this order', 404);
    }

    const ageMs = Date.now() - order.review.created_at.getTime();
    if (ageMs > SEVEN_DAYS_MS) {
      throw new AppError('The 7-day edit window for this review has closed', 403);
    }

    const updated = await prisma.review.update({
      where: { id: order.review.id },
      data: {
        review_text: data.review_text ?? null,
        ...(data.media !== undefined
          ? {
              media: {
                deleteMany: {},
                create: data.media.map((m, i) => ({
                  media_url: m.media_url,
                  public_id: m.public_id ?? null,
                  media_type: m.media_type ?? 'IMAGE',
                  position: m.position ?? i,
                })),
              },
            }
          : {}),
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    reviewLogger.info('Review edited', {
      action: 'editReview',
      reviewId: order.review.id,
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
      media: updated.media?.length
        ? updated.media.map((m) => ({
            id: m.id,
            media_url: m.media_url,
            public_id: m.public_id,
            media_type: m.media_type as 'IMAGE' | 'VIDEO',
            position: m.position,
          }))
        : undefined,
    };
  }

  static async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    minRating?: number,
    maxRating?: number
  ): Promise<{ reviews: ReviewData[]; summary: ReviewSummary }> {
    const baseWhere = {
      vendor_id: vendorId,
      moderation_status: ModerationStatus.APPROVED,
      review_text: { not: null },
    };

    const ratingFilter = minRating !== undefined || maxRating !== undefined
      ? {
          overall_rating: {
            ...(minRating !== undefined ? { gte: minRating } : {}),
            ...(maxRating !== undefined ? { lte: maxRating } : {}),
          },
        }
      : {};

    const listWhere = { ...baseWhere, ...ratingFilter };

    const [reviews, total, distributionRows] = await Promise.all([
      prisma.review.findMany({
        where: listWhere,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: { orderBy: { position: 'asc' } },
        },
      }),
      prisma.review.count({ where: listWhere }),
      prisma.review.groupBy({
        by: ['overall_rating'],
        where: baseWhere,
        _count: { overall_rating: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distributionRows) {
      distribution[row.overall_rating] = row._count.overall_rating;
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
        media: r.media?.length
          ? r.media.map((m) => ({
              id: m.id,
              media_url: m.media_url,
              public_id: m.public_id,
              media_type: m.media_type as 'IMAGE' | 'VIDEO',
              position: m.position,
            }))
          : undefined,
      })),
      summary: {
        total_reviews: total,
        distribution,
      },
    };
  }
}
