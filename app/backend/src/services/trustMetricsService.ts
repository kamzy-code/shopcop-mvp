import { prisma } from '@config/prisma.js';
import { trustMetricsLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { ModerationStatus, RefundStatus, TransactionStatus } from '../generated/prisma/enums.js';
import type { TrustMetrics } from '../types/trustMetricsTypes.js';

export class TrustMetricsService {
  static async recalculateVendorTrustMetrics(vendorId: string): Promise<void> {
    try {
      // ── 1. Performance metrics — derived from transaction data only ──────────

      const [
        totalTransactions,
        completedTransactions, // fetched once; derive completedCount from .length
        refundedCount,
        lastTransaction,
        responseTimeRows,
      ] = await Promise.all([
        prisma.transaction.count({ where: { vendor_id: vendorId } }),

        // Fetch completed rows to compute both completedCount and on-time rate,
        // eliminating the second DB trip that existed before.
        prisma.transaction.findMany({
          where: { vendor_id: vendorId, status: TransactionStatus.COMPLETED },
          select: { delivered_at: true, expected_delivery_end: true },
        }),

        // Refunds are tracked via the separate refund_status field.
        // TransactionStatus.REFUNDED is never the terminal state — all transactions
        // close at COMPLETED, with refund_status = REFUNDED for refunded ones.
        prisma.transaction.count({
          where: { vendor_id: vendorId, refund_status: RefundStatus.REFUNDED },
        }),

        // Last activity: most recent completed or refunded transaction (by update time)
        prisma.transaction.findFirst({
          where: {
            vendor_id: vendorId,
            status: { in: [TransactionStatus.COMPLETED, TransactionStatus.REFUNDED] },
          },
          orderBy: { updated_at: 'desc' },
          select: { updated_at: true },
        }),

        // Response time: payment proof submitted → vendor confirms payment
        prisma.transaction.findMany({
          where: {
            vendor_id: vendorId,
            payment_proof_submitted_at: { not: null },
            payment_confirmed_at: { not: null },
          },
          select: { payment_proof_submitted_at: true, payment_confirmed_at: true },
        }),
      ]);

      const completedCount = completedTransactions.length;

      const fulfillmentRate =
        totalTransactions > 0
          ? Math.round((completedCount / totalTransactions) * 10000) / 100
          : 0;

      const refundRate =
        completedCount > 0
          ? Math.round((refundedCount / completedCount) * 10000) / 100
          : 0;

      const onTimeCount = completedTransactions.filter(
        (t) =>
          t.delivered_at && t.expected_delivery_end && t.delivered_at <= t.expected_delivery_end
      ).length;
      const onTimeDeliveryRate =
        completedCount > 0 ? Math.round((onTimeCount / completedCount) * 10000) / 100 : 0;

      let avgResponseTimeMinutes = 0;
      if (responseTimeRows.length > 0) {
        const totalMinutes = responseTimeRows.reduce((sum, t) => {
          const diffMs =
            t.payment_confirmed_at!.getTime() - t.payment_proof_submitted_at!.getTime();
          return sum + diffMs / 60000;
        }, 0);
        avgResponseTimeMinutes = Math.round(totalMinutes / responseTimeRows.length);
      }

      // ── 2. Customer feedback metrics — derived from approved reviews only ────

      const [overallAgg, deliveryAgg, responseAgg, satisfactionAgg, reviewCount] =
        await Promise.all([
          prisma.review.aggregate({
            where: { vendor_id: vendorId, moderation_status: ModerationStatus.APPROVED },
            _avg: { overall_rating: true },
          }),
          prisma.review.aggregate({
            where: {
              vendor_id: vendorId,
              moderation_status: ModerationStatus.APPROVED,
              delivery_rating: { not: null },
            },
            _avg: { delivery_rating: true },
          }),
          prisma.review.aggregate({
            where: {
              vendor_id: vendorId,
              moderation_status: ModerationStatus.APPROVED,
              response_rating: { not: null },
            },
            _avg: { response_rating: true },
          }),
          prisma.review.aggregate({
            where: {
              vendor_id: vendorId,
              moderation_status: ModerationStatus.APPROVED,
              satisfaction_rating: { not: null },
            },
            _avg: { satisfaction_rating: true },
          }),
          prisma.review.count({
            where: { vendor_id: vendorId, moderation_status: ModerationStatus.APPROVED },
          }),
        ]);

      const round2 = (n: number | null | undefined): number =>
        n != null ? Math.round(n * 100) / 100 : 0;

      const averageRating = round2(overallAgg._avg.overall_rating);
      const avgDeliveryRating = round2(deliveryAgg._avg.delivery_rating);
      const avgResponseRating = round2(responseAgg._avg.response_rating);
      const customerSatisfactionRating = round2(satisfactionAgg._avg.satisfaction_rating);

      // ── 3. Persist ───────────────────────────────────────────────────────────

      await prisma.vendorProfile.update({
        where: { id: vendorId },
        data: {
          // Performance
          total_transactions: totalTransactions,
          successful_transactions: completedCount,
          fulfillment_rate: fulfillmentRate,
          refund_rate: refundRate,
          on_time_delivery_rate: onTimeDeliveryRate,
          avg_response_time_minutes: avgResponseTimeMinutes,
          last_transaction_at: lastTransaction?.updated_at ?? null,
          // Feedback
          review_count: reviewCount,
          average_rating: averageRating,
          avg_delivery_rating: avgDeliveryRating,
          avg_response_rating: avgResponseRating,
          customer_satisfaction_rating: customerSatisfactionRating,
        },
      });

      trustMetricsLogger.info('Vendor trust metrics recalculated', {
        vendorId,
        totalTransactions,
        completedCount,
        fulfillmentRate,
        refundRate,
        onTimeDeliveryRate,
        avgResponseTimeMinutes,
        reviewCount,
        averageRating,
        avgDeliveryRating,
        avgResponseRating,
        customerSatisfactionRating,
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
        on_time_delivery_rate: true,
        avg_response_time_minutes: true,
        last_transaction_at: true,
        review_count: true,
        average_rating: true,
        avg_delivery_rating: true,
        avg_response_rating: true,
        customer_satisfaction_rating: true,
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
