import { prisma } from '@config/prisma.js';
import { publicProfileLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import { ReviewService } from '@services/reviewService.js';
import type { PublicProfileResult, } from '../types/trustMetricsTypes.js';


export class PublicProfileService {
  static async getPublicProfile(
    slug: string,
    reviewPage: number = 1,
    reviewLimit: number = 10,
    productPage: number = 1,
    productLimit: number = 20
  ): Promise<PublicProfileResult> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        business_name: true,
        slug: true,
        profile_photo_url: true,
        business_description: true,
        state: true,
        city: true,
        primary_category: true,
        current_tier: true,
        refund_policy_type: true,
        refund_duration_days: true,
        refund_conditions: true,
        refund_custom_notes: true,
        instagram_handle: true,
        tiktok_handle: true,
        facebook_url: true,
        whatsapp_number: true,
        primary_contact: true,
        created_at: true,
      },
    });

    if (!vendor) {
      publicProfileLogger.warn('Vendor not found for slug', { action: 'getPublicProfile', slug });
      throw new AppError('Vendor not found', 404);
    }

    const [trustMetrics, reviewsResult, productsResult] = await Promise.all([
      TrustMetricsService.getVendorTrustMetrics(vendor.id),
      ReviewService.getVendorReviews(vendor.id, reviewPage, reviewLimit),
      this.getVendorProducts(vendor.id, productPage, productLimit),
    ]);

    publicProfileLogger.info('Public profile fetched', {
      action: 'getPublicProfile',
      slug,
      vendorId: vendor.id,
    });

    return {
      profile: vendor,
      trustMetrics,
      reviews: {
        data: reviewsResult.reviews,
        summary: reviewsResult.summary,
        meta: {
          page: reviewPage,
          limit: reviewLimit,
          total: reviewsResult.total,
          totalPages: Math.ceil(reviewsResult.total / reviewLimit),
        },
      },
      products: productsResult,
    };
  }

  private static async getVendorProducts(
    vendorId: string,
    page: number,
    limit: number
  ): Promise<PublicProfileResult['products']> {
    const where = {
      vendor_id: vendorId,
      deleted_at: null,
      stock_status: 'IN_STOCK' as const,
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          category: true,
          stock_status: true,
          media: {
            where: { is_primary: true },
            select: { media_url: true, media_type: true },
            take: 1,
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => ({
        ...p,
        media: p.media.length > 0 ? p.media : [],
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
