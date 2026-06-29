import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { OrderStatus, RefundStatus } from '../../generated/prisma/enums.js';
import { ListAdminOrdersQuery } from '@validators/adminOrderValidator.js';

const ADMIN_ORDER_INCLUDE = {
  items: true,
  vendor: { select: { id: true, business_name: true, current_tier: true } },
  status_history: { orderBy: { created_at: 'asc' as const } },
} as const;

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
   * Platform-wide order analytics: totals, completion rate, revenue, refund rate,
   * status breakdown, plus a "needing attention" queue (proof submitted,
   * refund requested, and delivered-but-late orders).
   */
  static async getAnalytics(adminId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      allCompleted,
      monthOrders,
      monthRevenue,
      refundCount,
      proofSubmitted,
      refundRequested,
      lateDelivered,
    ] = await Promise.all([
      prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      prisma.order.groupBy({
        by: ['status'],
        where: { created_at: { gte: monthStart } },
        _count: { status: true },
      }),
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, completed_at: { gte: monthStart } },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      // Only REFUNDED counts as an actual refund — RESOLVED means the refund
      // request was rejected and no money moved, so it must not inflate the rate.
      prisma.order.count({
        where: {
          refund_status: RefundStatus.REFUNDED,
          status: OrderStatus.COMPLETED,
          completed_at: { gte: monthStart },
        },
      }),
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

    const monthTotal = monthOrders.reduce((sum, row) => sum + row._count.status, 0);
    const completedThisMonth = monthRevenue._count.id;
    const completionRate = monthTotal > 0 ? (completedThisMonth / monthTotal) * 100 : 0;
    const refundRate = completedThisMonth > 0 ? (refundCount / completedThisMonth) * 100 : 0;
    const avgOrderValue =
      completedThisMonth > 0
        ? Number(monthRevenue._sum.total_amount ?? 0) / completedThisMonth
        : 0;

    const statusCounts = Object.fromEntries(monthOrders.map((row) => [row.status, row._count.status]));

    adminLogger.info('Admin fetched order analytics', { action: 'getOrderAnalytics', adminId });

    return {
      all_time_completed: allCompleted,
      this_month: {
        total_orders: monthTotal,
        completed: completedThisMonth,
        revenue: monthRevenue._sum.total_amount ?? 0,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        completion_rate: Math.round(completionRate),
        refund_rate: Math.round(refundRate * 10) / 10,
        by_status: statusCounts,
      },
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
