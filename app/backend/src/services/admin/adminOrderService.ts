import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { OrderStatus, RefundStatus } from '../../generated/prisma/enums.js';
import { ListAdminOrdersQuery, AnalyticsPeriod } from '@validators/adminOrderValidator.js';

const ADMIN_ORDER_INCLUDE = {
  items: true,
  vendor: { select: { id: true, business_name: true, current_tier: true } },
  status_history: { orderBy: { created_at: 'asc' as const } },
  review: { include: { media: { orderBy: { position: 'asc' as const } } } },
} as const;

interface DateRange {
  start?: Date;
  end?: Date;
}

/** Computes the shared analytics shape (totals/completion/refund rate/by-status) for a date window. */
async function computeOrderAnalyticsBlock({ start, end }: DateRange) {
  const dateFilter = {
    ...(start && { gte: start }),
    ...(end && { lt: end }),
  };
  const hasFilter = !!start || !!end;

  const completedWhere = hasFilter
    ? { status: OrderStatus.COMPLETED, completed_at: dateFilter }
    : { status: OrderStatus.COMPLETED };
  const groupByWhere = hasFilter ? { created_at: dateFilter } : {};
  const refundWhere = hasFilter
    ? { refund_status: RefundStatus.REFUNDED, status: OrderStatus.COMPLETED, completed_at: dateFilter }
    : { refund_status: RefundStatus.REFUNDED, status: OrderStatus.COMPLETED };

  const [groupedOrders, revenue, refundCount] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: groupByWhere, _count: { status: true } }),
    prisma.order.aggregate({ where: completedWhere, _sum: { total_amount: true }, _count: { id: true } }),
    // Only REFUNDED counts as an actual refund — RESOLVED means the refund
    // request was rejected and no money moved, so it must not inflate the rate.
    prisma.order.count({ where: refundWhere }),
  ]);

  const totalOrders = groupedOrders.reduce((sum, row) => sum + row._count.status, 0);
  const completed = revenue._count.id;
  const completionRate = totalOrders > 0 ? (completed / totalOrders) * 100 : 0;
  const refundRate = completed > 0 ? (refundCount / completed) * 100 : 0;
  const avgOrderValue = completed > 0 ? Number(revenue._sum.total_amount ?? 0) / completed : 0;
  const byStatus = Object.fromEntries(groupedOrders.map((row) => [row.status, row._count.status]));

  return {
    total_orders: totalOrders,
    completed,
    revenue: revenue._sum.total_amount ?? 0,
    avg_order_value: Math.round(avgOrderValue * 100) / 100,
    completion_rate: Math.round(completionRate),
    refund_rate: Math.round(refundRate * 10) / 10,
    by_status: byStatus,
  };
}

/**
 * Resolves a named period to a `[start, end)` window.
 * - Without `referenceDate`: anchored to now, open-ended (`end` is undefined so it includes up to the present moment).
 * - With `referenceDate`: a fully bounded historical window for that specific day/week/month/year.
 * 'all_time' always returns an unbounded range regardless of `referenceDate`.
 */
function resolvePeriodRange(period: AnalyticsPeriod, referenceDate?: Date): DateRange {
  if (period === 'all_time') return {};

  const ref = referenceDate ?? new Date();
  const bounded = !!referenceDate;

  switch (period) {
    case 'daily': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
      const end = bounded ? new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1) : undefined;
      return { start, end };
    }
    case 'weekly': {
      // Monday-based calendar week containing `ref`.
      const day = ref.getDay();
      const diffToMonday = (day + 6) % 7;
      const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - diffToMonday);
      const end = bounded ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) : undefined;
      return { start, end };
    }
    case 'monthly': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = bounded ? new Date(ref.getFullYear(), ref.getMonth() + 1, 1) : undefined;
      return { start, end };
    }
    case 'yearly': {
      const start = new Date(ref.getFullYear(), 0, 1);
      const end = bounded ? new Date(ref.getFullYear() + 1, 0, 1) : undefined;
      return { start, end };
    }
  }
}

export class AdminOrderService {
  /** List orders across all vendors with filters, search, and pagination. */
  static async listOrders(filters: ListAdminOrdersQuery, adminId: string) {
    const { vendor_id, status, payment_status, refund_status, search, sort, from_date, to_date, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (vendor_id) where.vendor_id = vendor_id;
    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (refund_status) where.refund_status = refund_status;

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { buyer_email: { contains: search, mode: 'insensitive' } },
        { vendor: { business_name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { item_name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (from_date || to_date) {
      where.created_at = {
        ...(from_date && { gte: from_date }),
        ...(to_date && { lte: to_date }),
      };
    }

    const orderBy = (() => {
      switch (sort) {
        case 'oldest':
          return { created_at: 'asc' as const };
        case 'amount_asc':
          return { total_amount: 'asc' as const };
        case 'amount_desc':
          return { total_amount: 'desc' as const };
        default:
          return { created_at: 'desc' as const };
      }
    })();

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          items: { take: 5 },
          vendor: { select: { id: true, business_name: true } },
        },
      }),
    ]);

    adminLogger.info('Admin fetched order list', { action: 'listOrders', adminId, total, vendor_id, status });

    return { data: orders, total, totalPages: Math.ceil(total / limit), page, limit };
  }

  /**
   * Platform-wide order analytics for a single selected period (daily/weekly/
   * monthly/yearly/all_time): totals, completion rate, revenue, refund rate,
   * status breakdown, plus a "needing attention" queue (proof submitted,
   * refund requested, and delivered-but-late orders — unaffected by the period).
   *
   * @param referenceDate - Anchors the period to a specific day/week/month/year
   * (e.g. picking March 2025 for 'monthly') instead of the current one.
   */
  static async getAnalytics(adminId: string, period: AnalyticsPeriod = 'monthly', referenceDate?: Date) {
    const now = new Date();
    const range = resolvePeriodRange(period, referenceDate);

    const [summary, proofSubmitted, refundRequested, lateDelivered] = await Promise.all([
      computeOrderAnalyticsBlock(range),
      prisma.order.findMany({
        where: { payment_status: 'PROOF_SUBMITTED' },
        orderBy: { payment_proof_submitted_at: 'asc' },
        take: 20,
        include: { vendor: { select: { id: true, business_name: true } } },
      }),
      prisma.order.findMany({
        where: { refund_status: RefundStatus.REQUESTED },
        orderBy: { refund_initiated_at: 'asc' },
        take: 20,
        include: { vendor: { select: { id: true, business_name: true } } },
      }),
      prisma.order.findMany({
        where: {
          status: OrderStatus.DELIVERED,
          delivered_at: { not: null },
          expected_delivery_end: { lt: now },
        },
        orderBy: { delivered_at: 'asc' },
        take: 20,
        include: { vendor: { select: { id: true, business_name: true } } },
      }),
    ]);

    adminLogger.info('Admin fetched order analytics', { action: 'getOrderAnalytics', adminId, period });

    return {
      period,
      summary,
      needing_attention: {
        proof_submitted: proofSubmitted,
        refund_requested: refundRequested,
        late_delivered: lateDelivered,
      },
    };
  }

  /** Get a single order's full detail for the admin review screen. */
  static async getOrderById(orderId: string, adminId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ADMIN_ORDER_INCLUDE,
    });

    if (!order) {
      adminLogger.warn('Order not found', { action: 'getOrderById', adminId, orderId });
      throw new AppError('Order not found', 404);
    }

    return order;
  }
}
