import { prisma } from '@config/prisma.js';
import { trustMetricsLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { ModerationStatus, TransactionStatus } from '../generated/prisma/enums.js';
import type { TrustMetrics } from '../types/trustMetricsTypes.js';

export class TrustMetricsService {
  static async recalculateVendorTrustMetrics(vendorId: string): Promise<void> {
    try {
      const [
        totalTransactions,
        completedCount,
        refundedCount,
        reviewStats,
        satisfactionStats,
        responseTimeResult,
        lastTransaction,
      ] = await Promise.all([
        prisma.transaction.count({ where: { vendor_id: vendorId } }),

        prisma.transaction.count({
          where: { vendor_id: vendorId, status: TransactionStatus.COMPLETED },
        }),

        prisma.transaction.count({
          where: { vendor_id: vendorId, status: TransactionStatus.REFUNDED },
        }),

        prisma.review.aggregate({
          where: { vendor_id: vendorId, moderation_status: ModerationStatus.APPROVED },
          _avg: { overall_rating: true },
        }),

        prisma.review.findMany({
          where: {
            vendor_id: vendorId,
            moderation_status: ModerationStatus.APPROVED,
            satisfaction_rating: { not: null },
          },
          select: { satisfaction_rating: true },
        }),

        prisma.transaction.findMany({
          where: {
            vendor_id: vendorId,
            payment_proof_submitted_at: { not: null },
            payment_confirmed_at: { not: null },
          },
          select: {
            payment_proof_submitted_at: true,
            payment_confirmed_at: true,
          },
        }),

        prisma.transaction.findFirst({
          where: { vendor_id: vendorId },
          orderBy: { created_at: 'desc' },
          select: { created_at: true },
        }),
      ]);

      const successfulTransactions = completedCount;
      const fulfillmentRate =
        totalTransactions > 0 ? Math.round((completedCount / totalTransactions) * 10000) / 100 : 0;
      const refundRate =
        successfulTransactions > 0
          ? Math.round((refundedCount / successfulTransactions) * 10000) / 100
          : 0;
      const averageRating = reviewStats._avg.overall_rating ?? 0;

      const satisfiedCount = satisfactionStats.filter(
        (r) => r.satisfaction_rating && r.satisfaction_rating >= 4
      ).length;
      const totalWithSatisfaction = satisfactionStats.length;
      const customerSatisfactionRate =
        totalWithSatisfaction > 0
          ? Math.round((satisfiedCount / totalWithSatisfaction) * 10000) / 100
          : 0;

      let onTimeDeliveryRate = 0;
      if (completedCount > 0) {
        const completedTransactions = await prisma.transaction.findMany({
          where: { vendor_id: vendorId, status: TransactionStatus.COMPLETED },
          select: { delivered_at: true, expected_delivery_end: true },
        });
        const onTimeCount = completedTransactions.filter(
          (t) =>
            t.delivered_at && t.expected_delivery_end && t.delivered_at <= t.expected_delivery_end
        ).length;
        onTimeDeliveryRate = Math.round((onTimeCount / completedCount) * 10000) / 100;
      }

      let avgResponseTimeMinutes = 0;
      if (responseTimeResult.length > 0) {
        const totalMinutes = responseTimeResult.reduce((sum, t) => {
          if (t.payment_proof_submitted_at && t.payment_confirmed_at) {
            const diffMs =
              t.payment_confirmed_at.getTime() - t.payment_proof_submitted_at.getTime();
            return sum + diffMs / 60000;
          }
          return sum;
        }, 0);
        avgResponseTimeMinutes = Math.round(totalMinutes / responseTimeResult.length);
      }

      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          total_transactions: totalTransactions,
          successful_transactions: successfulTransactions,
          fulfillment_rate: fulfillmentRate,
          refund_rate: refundRate,
          average_rating: averageRating,
          customer_satisfaction_rate: customerSatisfactionRate,
          on_time_delivery_rate: onTimeDeliveryRate,
          avg_response_time_minutes: avgResponseTimeMinutes,
          last_transaction_at: lastTransaction?.created_at ?? null,
        },
      });

      trustMetricsLogger.info('Vendor trust metrics recalculated', {
        vendorId,
        totalTransactions,
        successfulTransactions,
        fulfillmentRate,
        refundRate,
        averageRating,
        customerSatisfactionRate,
        onTimeDeliveryRate,
        avgResponseTimeMinutes,
      });
    } catch (error) {
      trustMetricsLogger.error('Failed to recalculate vendor trust metrics', { vendorId, error });
    }
  }

  static async getVendorTrustMetrics(vendorId: string): Promise<TrustMetrics> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: {
        total_transactions: true,
        successful_transactions: true,
        fulfillment_rate: true,
        refund_rate: true,
        average_rating: true,
        customer_satisfaction_rate: true,
        on_time_delivery_rate: true,
        avg_response_time_minutes: true,
        last_transaction_at: true,
      },
    });

    if (!vendor) {
      throw new AppError('Vendor not found', 404);
    }

    return vendor;
  }

  static async getVendorTrustMetricsByUserId(userId: string): Promise<TrustMetrics> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!vendor) {
      throw new AppError('Vendor profile not found', 404);
    }

    return this.getVendorTrustMetrics(vendor.id);
  }
}
