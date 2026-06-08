import { Decimal } from '@prisma/client/runtime/client';
import { prisma } from '@config/prisma.js';
import { orderLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { OrderStatus, RefundStatus, PaymentStatus } from '../generated/prisma/enums.js';
import { TrustMetricsService } from '@services/trustMetricsService.js';
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilters,
  PaginationMeta,
} from '../types/orderTypes.js';
import {
  generateTrackingToken,
  generateOrderReference,
  calculateSubtotal,
  calculateTotal,
  getStatusTimestampField,
  isTransitionValid,
  NON_CANCELLABLE_STATUSES,
  REFUND_STATUS_SYNC,
} from '@utils/orderUtils.js';

const ORDER_INCLUDE = {
  items: true,
  vendor: {
    select: {
      id: true,
      business_name: true,
      profile_photo_url: true,
      current_tier: true,
      whatsapp_number: true,
      refund_policy_type: true,
    },
  },
  status_history: { orderBy: { created_at: 'asc' as const } },
  review: true,
} as const;

// Buyer-facing include — adds bank details so the checkout page can show payment info.
// Never used on authenticated vendor endpoints to avoid leaking bank details.
const BUYER_ORDER_INCLUDE = {
  items: true,
  vendor: {
    select: {
      id: true,
      business_name: true,
      profile_photo_url: true,
      current_tier: true,
      whatsapp_number: true,
      bank_name: true,
      account_number: true,
      account_name: true,
      refund_policy_type: true,
      refund_duration_days: true,
    },
  },
  status_history: { orderBy: { created_at: 'asc' as const } },
  review: true,
} as const;

export class OrderService {
  private static async getVendorByUserId(userId: string) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        personal_info_complete: true,
        business_info_complete: true,
      },
    });
    if (!vendor) {
      orderLogger.warn('Vendor profile not found', { action: 'getVendorByUserId', userId });
      throw new AppError('Vendor profile not found', 404);
    }
    return vendor;
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  static async createOrder(userId: string, data: CreateOrderInput) {
    const vendor = await this.getVendorByUserId(userId);

    if (!vendor.personal_info_complete || !vendor.business_info_complete) {
      orderLogger.warn('Vendor profile incomplete, cannot create order', {
        action: 'createOrder',
        userId,
        vendorId: vendor.id,
      });
      throw new AppError(
        'Complete your personal and business profile before creating orders',
        400
      );
    }

    const itemSubtotals = data.items.map((item) => ({
      ...item,
      subtotal: item.item_price * item.quantity,
    }));

    const subtotal = calculateSubtotal(data.items);
    const total = calculateTotal(subtotal, data.delivery_fee, data.discount_amount);

    const [reference, tracking_token] = await Promise.all([
      generateOrderReference(vendor.id),
      generateTrackingToken(),
    ]);

    // Snapshot product details for catalog items
    const itemsWithSnapshots = await Promise.all(
      itemSubtotals.map(async (item) => {
        if (item.product_id) {
          const product = await prisma.product.findFirst({
            where: { id: item.product_id, vendor_id: vendor.id, deleted_at: null },
            select: {
              id: true,
              name: true,
              price: true,
              description: true,
              media: {
                orderBy: { is_primary: 'desc' },
                select: { media_url: true, media_type: true },
              },
            },
          });
          if (!product) {
            orderLogger.warn('Catalog product not found during order creation', {
              action: 'createOrder',
              userId,
              vendorId: vendor.id,
              productId: item.product_id,
            });
            throw new AppError(`Product not found: ${item.product_id}`, 404);
          }
          return {
            product_id: item.product_id,
            item_name: item.item_name || product.name,
            item_price: new Decimal(item.item_price),
            quantity: item.quantity,
            subtotal: new Decimal(item.subtotal),
            item_image_url:
              (
                product.media.find((m) => m.media_type === 'IMAGE') ??
                product.media.find((m) => m.media_type === 'VIDEO')
              )?.media_url ?? null,
            description: item.description || product.description || null,
          };
        }
        return {
          product_id: null,
          item_name: item.item_name,
          item_price: new Decimal(item.item_price),
          quantity: item.quantity,
          subtotal: new Decimal(item.subtotal),
          item_image_url: null,
          description: item.description ?? null,
        };
      })
    );

    const order = await prisma.order.create({
      data: {
        reference,
        tracking_token,
        vendor_id: vendor.id,
        buyer_email: data.buyer_email || null,
        delivery_method: data.delivery_method,
        expected_delivery_start: data.expected_delivery_start || null,
        expected_delivery_end: data.expected_delivery_end || null,
        subtotal: new Decimal(subtotal),
        delivery_fee: data.delivery_fee ? new Decimal(data.delivery_fee) : null,
        discount_amount: data.discount_amount ? new Decimal(data.discount_amount) : null,
        total_amount: new Decimal(total),
        order_notes: data.order_notes || null,
        vendor_notes: data.vendor_notes || null,
        items: {
          create: itemsWithSnapshots,
        },
      },
      include: ORDER_INCLUDE,
    });

    orderLogger.info('Order created', {
      orderId: order.id,
      reference: order.reference,
      vendorId: vendor.id,
    });

    return order;
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  static async getVendorOrders(userId: string, filters: OrderFilters) {
    const vendor = await this.getVendorByUserId(userId);

    const where: Record<string, unknown> = { vendor_id: vendor.id };

    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.refund_status && filters.refund_status !== 'ALL')
      where.refund_status = filters.refund_status;
    if (filters.payment_status && filters.payment_status !== 'ALL')
      where.payment_status = filters.payment_status;

    if (filters.search) {
      where.OR = [
        { buyer_email: { contains: filters.search, mode: 'insensitive' } },
        { reference: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.from_date || filters.to_date) {
      where.created_at = {
        ...(filters.from_date && { gte: filters.from_date }),
        ...(filters.to_date && { lte: filters.to_date }),
      };
    }

    const orderBy = (() => {
      switch (filters.sort) {
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
        include: {
          items: {
            select: {
              item_name: true,
              quantity: true,
              item_price: true,
              subtotal: true,
              item_image_url: true,
            },
          },
          vendor: { select: { id: true, business_name: true } },
        },
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
    ]);

    const meta: PaginationMeta = {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    };

    return { orders, meta };
  }

  // ─── Get single ───────────────────────────────────────────────────────────────

  static async getOrder(orderId: string, userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      orderLogger.warn('Order not found', {
        action: 'getOrder',
        userId,
        orderId,
      });
      throw new AppError('Order not found', 404);
    }
    if (order.vendor_id !== vendor.id) {
      orderLogger.warn('Unauthorized order access attempt', {
        action: 'getOrder',
        userId,
        orderId,
      });
      throw new AppError('Not authorized to view this order', 403);
    }

    return order;
  }

  // ─── Public tracking ──────────────────────────────────────────────────────────

  static async getOrderByToken(token: string) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
      include: BUYER_ORDER_INCLUDE,
    });

    if (!order) {
      orderLogger.warn('Order not found by tracking token', {
        action: 'getOrderByToken',
        token,
      });
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  // ─── Buyer: submit payment proof ──────────────────────────────────────────────

  static async submitPaymentProof(
    token: string,
    data: { buyer_email?: string; payment_proof_url?: string }
  ) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
    });

    if (!order) {
      orderLogger.warn('Order not found for payment proof submission', {
        action: 'submitPaymentProof',
        token,
      });
      throw new AppError('Order not found', 404);
    }

    if (order.payment_status !== PaymentStatus.UNPAID) {
      orderLogger.warn('Payment proof already submitted for order', {
        action: 'submitPaymentProof',
        orderId: order.id,
        paymentStatus: order.payment_status,
      });
      throw new AppError('Payment proof has already been submitted', 400);
    }

    const updated = await prisma.order.update({
      where: { tracking_token: token },
      data: {
        payment_status: PaymentStatus.PROOF_SUBMITTED,
        payment_proof_submitted_at: new Date(),
        ...(data.buyer_email && { buyer_email: data.buyer_email }),
        ...(data.payment_proof_url && { payment_proof_url: data.payment_proof_url }),
      },
      include: BUYER_ORDER_INCLUDE,
    });

    orderLogger.info('Buyer submitted payment proof', { orderId: updated.id });
    return updated;
  }

  // ─── Update (before CONFIRMED) ────────────────────────────────────────────────

  static async updateOrder(
    orderId: string,
    userId: string,
    data: UpdateOrderInput
  ) {
    const order = await this.getOrder(orderId, userId);

    if (order.status !== OrderStatus.PENDING) {
      orderLogger.warn('Attempted to edit non-pending order', {
        action: 'updateOrder',
        userId,
        orderId,
        status: order.status,
      });
      throw new AppError('Order can only be edited while PENDING', 400);
    }

    // ── Metadata-only fields (always applied) ─────────────────────────────────
    const metaUpdate = {
      ...(data.buyer_email !== undefined && { buyer_email: data.buyer_email || null }),
      ...(data.delivery_method !== undefined && { delivery_method: data.delivery_method || null }),
      ...(data.expected_delivery_start !== undefined && {
        expected_delivery_start: data.expected_delivery_start,
      }),
      ...(data.expected_delivery_end !== undefined && {
        expected_delivery_end: data.expected_delivery_end,
      }),
      ...(data.order_notes !== undefined && { order_notes: data.order_notes || null }),
      ...(data.vendor_notes !== undefined && { vendor_notes: data.vendor_notes || null }),
      ...(data.delivery_fee !== undefined && { delivery_fee: new Decimal(data.delivery_fee) }),
      ...(data.discount_amount !== undefined && {
        discount_amount: new Decimal(data.discount_amount),
      }),
    };

    // ── Item replacement (when items are provided) ─────────────────────────────
    if (data.items && data.items.length > 0) {
      const vendor = await this.getVendorByUserId(userId);

      const itemSubtotals = data.items.map((item) => ({
        ...item,
        subtotal: item.item_price * item.quantity,
      }));
      const subtotal = calculateSubtotal(data.items);

      const itemsWithSnapshots = await Promise.all(
        itemSubtotals.map(async (item) => {
          if (item.product_id) {
            const product = await prisma.product.findFirst({
              where: { id: item.product_id, vendor_id: vendor.id, deleted_at: null },
              select: {
                id: true,
                name: true,
                price: true,
                description: true,
                media: {
                  orderBy: { is_primary: 'desc' as const },
                  select: { media_url: true, media_type: true },
                },
              },
            });
            if (!product) {
              orderLogger.warn('Catalog product not found during order update', {
                action: 'updateOrder',
                userId,
                orderId,
                productId: item.product_id,
              });
              throw new AppError(`Product not found: ${item.product_id}`, 404);
            }
            return {
              product_id: item.product_id,
              item_name: item.item_name || product.name,
              item_price: new Decimal(item.item_price),
              quantity: item.quantity,
              subtotal: new Decimal(item.subtotal),
              item_image_url:
                (
                  product.media.find((m) => m.media_type === 'IMAGE') ??
                  product.media.find((m) => m.media_type === 'VIDEO')
                )?.media_url ?? null,
              description: item.description || product.description || null,
            };
          }
          return {
            product_id: null,
            item_name: item.item_name,
            item_price: new Decimal(item.item_price),
            quantity: item.quantity,
            subtotal: new Decimal(item.subtotal),
            item_image_url: null,
            description: item.description ?? null,
          };
        })
      );

      const existingDeliveryFee = Number(order.delivery_fee ?? 0);
      const existingDiscount = Number(order.discount_amount ?? 0);
      const deliveryFee = data.delivery_fee ?? existingDeliveryFee;
      const discount = data.discount_amount ?? existingDiscount;
      const total = calculateTotal(subtotal, deliveryFee, discount);

      const updated = await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { order_id: orderId } });
        return tx.order.update({
          where: { id: orderId },
          data: {
            ...metaUpdate,
            subtotal: new Decimal(subtotal),
            total_amount: new Decimal(total),
            items: { create: itemsWithSnapshots },
          },
          include: ORDER_INCLUDE,
        });
      });

      orderLogger.info('Order updated (with items)', { orderId });
      return updated;
    }

    // ── Metadata-only path ─────────────────────────────────────────────────────
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: metaUpdate,
      include: ORDER_INCLUDE,
    });

    orderLogger.info('Order updated', { orderId });
    return updated;
  }

  // ─── Confirm payment (stock deduction) ────────────────────────────────────────

  static async confirmPayment(orderId: string, userId: string, notes?: string) {
    // Unified 404 / 403 check — consistent with all other mutating methods.
    await this.getOrder(orderId, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside the $transaction for atomic consistency (uses tx client, not prisma).
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      // Safety net: should never fire given the check above, but guards against
      // race conditions where the order was deleted between the two fetches.
      if (!order) {
        orderLogger.warn('Order not found during payment confirmation (safety net)', {
          action: 'confirmPayment',
          userId,
          orderId,
        });
        throw new AppError('Order not found', 404);
      }

      if (order.status !== OrderStatus.PENDING) {
        orderLogger.warn('Attempted to confirm payment on non-pending order', {
          action: 'confirmPayment',
          userId,
          orderId,
          status: order.status,
        });
        throw new AppError('Only PENDING orders can have payment confirmed', 400);
      }

      // Deduct stock for each catalog item with inventory tracking
      for (const item of order.items) {
        if (!item.product_id) continue;

        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          select: {
            id: true,
            name: true,
            track_inventory: true,
            stock_quantity: true,
            low_stock_threshold: true,
            vendor_id: true,
          },
        });

        if (!product) continue;
        if (!product.track_inventory) continue;

        const available = product.stock_quantity ?? 0;
        if (available < item.quantity) {
          orderLogger.warn('Insufficient stock during payment confirmation', {
            action: 'confirmPayment',
            userId,
            orderId,
            productId: product.id,
            productName: product.name,
            available,
            requested: item.quantity,
          });
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${available}, requested: ${item.quantity}`,
            400
          );
        }

        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });

        await tx.orderItem.update({
          where: { id: item.id },
          data: { stock_deducted: item.quantity },
        });

        const newQty = available - item.quantity;
        if (newQty === 0) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { stock_status: 'OUT_OF_STOCK' },
          });

          //Send Notification Later
          orderLogger.warn('Product out of stock after order confirmation', {
            productId: product.id,
            productName: product.name,
            vendorId: product.vendor_id,
          });
        } else if (product.low_stock_threshold && newQty <= product.low_stock_threshold) {
          //Send notification later

          orderLogger.warn('Product low stock after order confirmation', {
            productId: product.id,
            productName: product.name,
            vendorId: product.vendor_id,
            remaining: newQty,
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED,
          payment_status: 'PAID',
          confirmed_at: new Date(),
          payment_confirmed_at: new Date(),
          payment_notes: notes || null,
        },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: OrderStatus.PENDING,
          to_status: OrderStatus.CONFIRMED,
          changed_by: userId,
          note: notes || 'Payment confirmed by vendor',
        },
      });

      return updated;
    });

    orderLogger.info('Payment confirmed, stock deducted', {
      orderId,
      reference: result.reference,
    });

    return result;
  }

  // ─── Update status ────────────────────────────────────────────────────────────

  static async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatus: OrderStatus,
    note?: string
  ) {
    const order = await this.getOrder(orderId, userId);

    if (!isTransitionValid(order.status, newStatus)) {
      orderLogger.warn('Invalid order status transition', {
        action: 'updateOrderStatus',
        userId,
        orderId,
        fromStatus: order.status,
        toStatus: newStatus,
      });
      throw new AppError(`Cannot transition from ${order.status} to ${newStatus}`, 400);
    }

    const timestampField = getStatusTimestampField(newStatus);
    const timestampData = timestampField ? { [timestampField]: new Date() } : {};

    // Set auto_close_at 48 hours after DELIVERED
    const autoCloseData =
      newStatus === OrderStatus.DELIVERED
        ? { auto_close_at: new Date(Date.now() + 48 * 60 * 60 * 1000) }
        : {};

    // Sync refund_status so it persists the refund outcome even after status → COMPLETED
    const refundStatusSync = REFUND_STATUS_SYNC[newStatus];
    const refundStatusData =
      refundStatusSync !== undefined ? { refund_status: refundStatusSync } : {};

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...timestampData,
          ...autoCloseData,
          ...refundStatusData,
        },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: newStatus,
          changed_by: userId,
          note: note || null,
        },
      });

      return updated;
    });

    orderLogger.info('Order status updated', {
      orderId,
      from: order.status,
      to: newStatus,
    });

    if (newStatus === OrderStatus.COMPLETED || newStatus === OrderStatus.REFUNDED || newStatus === OrderStatus.RESOLVED) {
      TrustMetricsService.recalculateVendorTrustMetrics(result.vendor_id);
    }

    return result;
  }

  // ─── Cancel order (with stock restoration) ──────────────────────────────

  static async cancelOrder(orderId: string, userId: string, reason: string) {
    // Unified 404 / 403 check — consistent with all other mutating methods.
    await this.getOrder(orderId, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside the $transaction for atomic consistency.
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      // Safety net only — ownership already verified above.
      if (!order) {
        orderLogger.warn('Order not found during cancellation (safety net)', {
          action: 'cancelOrder',
          userId,
          orderId,
        });
        throw new AppError('Order not found', 404);
      }

      if (NON_CANCELLABLE_STATUSES.includes(order.status)) {
        orderLogger.warn('Attempted to cancel non-cancellable order', {
          action: 'cancelOrder',
          userId,
          orderId,
          status: order.status,
        });
        throw new AppError(`Cannot cancel an order in ${order.status} status`, 400);
      }

      // Restore stock for items that had stock deducted
      for (const item of order.items) {
        if (item.stock_deducted <= 0 || !item.product_id) continue;

        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { increment: item.stock_deducted } },
        });

        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            stock_restored: item.stock_deducted,
            stock_deducted: 0,
          },
        });
      }

      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelled_by: userId,
          cancellation_reason: reason,
          cancelled_at: new Date(),
        },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: OrderStatus.CANCELLED,
          changed_by: userId,
          note: reason,
        },
      });

      return cancelled;
    });

    orderLogger.info('Order cancelled, stock restored', {
      orderId,
      reference: result.reference,
    });

    return result;
  }

  // ─── Buyer: cancel order by token ───────────────────────────────────────

  static async buyerCancelOrder(token: string, reason: string) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
    });

    if (!order) {
      orderLogger.warn('Order not found for buyer cancellation', {
        action: 'buyerCancelOrder',
        token,
      });
      throw new AppError('Order not found', 404);
    }

    if (order.status !== OrderStatus.PENDING) {
      orderLogger.warn('Cannot cancel non-PENDING order as buyer', {
        action: 'buyerCancelOrder',
        orderId: order.id,
        status: order.status,
      });
      throw new AppError('Only pending orders can be cancelled', 400);
    }

    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelled_by: 'buyer',
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
      include: BUYER_ORDER_INCLUDE,
    });

    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        from_status: order.status,
        to_status: OrderStatus.CANCELLED,
        changed_by: 'buyer',
        note: reason,
      },
    });

    orderLogger.info('Buyer cancelled order', { orderId: order.id, token });

    const { vendor_notes: _omit, ...buyerSafe } = cancelled;
    void _omit;
    return buyerSafe;
  }

  // ─── Buyer: confirm delivery by token ─────────────────────────────────────────

  static async buyerConfirmDelivery(token: string) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
    });

    if (!order) {
      orderLogger.warn('Order not found for buyer delivery confirmation', {
        action: 'buyerConfirmDelivery',
        token,
      });
      throw new AppError('Order not found', 404);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      orderLogger.warn('Cannot confirm delivery — order not DELIVERED', {
        action: 'buyerConfirmDelivery',
        orderId: order.id,
        status: order.status,
      });
      throw new AppError('Only delivered orders can be confirmed as received', 400);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.COMPLETED,
        completed_at: new Date(),
      },
      include: BUYER_ORDER_INCLUDE,
    });

    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        from_status: order.status,
        to_status: OrderStatus.COMPLETED,
        changed_by: 'buyer',
        note: 'Buyer confirmed delivery',
      },
    });

    orderLogger.info('Buyer confirmed delivery', { orderId: order.id, token });

    TrustMetricsService.recalculateVendorTrustMetrics(updated.vendor_id);

    const { vendor_notes: _omit, ...buyerSafe } = updated;
    void _omit;
    return buyerSafe;
  }

  // ─── Buyer: close a REFUNDED or RESOLVED order ─────────────────────────

  static async buyerCloseResolution(token: string) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
    });

    if (!order) {
      orderLogger.warn('Order not found for buyer close resolution', {
        action: 'buyerCloseResolution',
        token,
      });
      throw new AppError('Order not found', 404);
    }

    if (
      order.status !== OrderStatus.REFUNDED &&
      order.status !== OrderStatus.RESOLVED
    ) {
      orderLogger.warn('Cannot close resolution — order not REFUNDED or RESOLVED', {
        action: 'buyerCloseResolution',
        orderId: order.id,
        status: order.status,
      });
      throw new AppError('Only refunded or resolved orders can be closed by the buyer', 400);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.COMPLETED,
        completed_at: new Date(),
      },
      include: BUYER_ORDER_INCLUDE,
    });

    await prisma.orderStatusHistory.create({
      data: {
        order_id: order.id,
        from_status: order.status,
        to_status: OrderStatus.COMPLETED,
        changed_by: 'buyer',
        note: 'Buyer acknowledged refund/resolution and closed the order',
      },
    });

    orderLogger.info('Buyer closed resolution', { orderId: order.id, token });

    TrustMetricsService.recalculateVendorTrustMetrics(updated.vendor_id);

    const { vendor_notes: _omit, ...buyerSafe } = updated;
    void _omit;
    return buyerSafe;
  }

  // ─── Buyer: request refund by token ──────────────────────────────────────────

  static async buyerRequestRefund(token: string, reason: string) {
    const order = await prisma.order.findUnique({
      where: { tracking_token: token },
    });

    if (!order) {
      orderLogger.warn('Order not found for buyer refund request', {
        action: 'buyerRequestRefund',
        token,
      });
      throw new AppError('Order not found', 404);
    }

    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
      orderLogger.warn('Cannot request refund — order not DELIVERED or COMPLETED', {
        action: 'buyerRequestRefund',
        orderId: order.id,
        status: order.status,
      });
      throw new AppError('Refund can only be requested for delivered or completed orders', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REFUND_REQUESTED,
          refund_status: RefundStatus.REQUESTED,
          refund_initiated_at: new Date(),
          refund_reason: reason,
        },
        include: BUYER_ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          from_status: order.status,
          to_status: OrderStatus.REFUND_REQUESTED,
          changed_by: 'buyer',
          note: reason,
        },
      });

      return result;
    });

    orderLogger.info('Buyer requested refund', { orderId: order.id, token });

    const { vendor_notes: _omit, ...buyerSafe } = updated;
    void _omit;
    return buyerSafe;
  }

  // ─── Update status with refund data ───────────────────────────────────────────

  static async updateOrderStatusWithRefund(
    orderId: string,
    userId: string,
    newStatus: OrderStatus,
    note?: string,
    refundAmount?: number,
    refundVendorNotes?: string,
  ) {
    const order = await this.getOrder(orderId, userId);

    if (!isTransitionValid(order.status, newStatus)) {
      orderLogger.warn('Invalid order status transition', {
        action: 'updateOrderStatusWithRefund',
        userId,
        orderId,
        fromStatus: order.status,
        toStatus: newStatus,
      });
      throw new AppError(`Cannot transition from ${order.status} to ${newStatus}`, 400);
    }

    const timestampField = getStatusTimestampField(newStatus);
    const timestampData = timestampField ? { [timestampField]: new Date() } : {};

    const autoCloseData =
      newStatus === OrderStatus.DELIVERED
        ? { auto_close_at: new Date(Date.now() + 48 * 60 * 60 * 1000) }
        : {};

    const refundStatusSync = REFUND_STATUS_SYNC[newStatus];
    const refundStatusData =
      refundStatusSync !== undefined ? { refund_status: refundStatusSync } : {};

    const refundData = {
      ...(refundAmount !== undefined && { refund_amount: new Decimal(refundAmount) }),
      ...(refundVendorNotes !== undefined && { refund_vendor_notes: refundVendorNotes }),
    };

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...timestampData,
          ...autoCloseData,
          ...refundStatusData,
          ...refundData,
        },
        include: ORDER_INCLUDE,
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: orderId,
          from_status: order.status,
          to_status: newStatus,
          changed_by: userId,
          note: note || null,
        },
      });

      return updated;
    });

    orderLogger.info('Order status updated with refund info', {
      orderId,
      from: order.status,
      to: newStatus,
    });

    if (newStatus === OrderStatus.COMPLETED || newStatus === OrderStatus.REFUNDED || newStatus === OrderStatus.RESOLVED) {
      TrustMetricsService.recalculateVendorTrustMetrics(result.vendor_id);
    }

    return result;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  static async getAnalyticsSummary(userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allCompleted, monthOrders, monthRevenue, refundCount] = await Promise.all([
      prisma.order.count({
        where: { vendor_id: vendor.id, status: OrderStatus.COMPLETED },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { vendor_id: vendor.id, created_at: { gte: monthStart } },
        _count: { status: true },
      }),
      prisma.order.aggregate({
        where: {
          vendor_id: vendor.id,
          status: OrderStatus.COMPLETED,
          completed_at: { gte: monthStart },
        },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.order.count({
        where: {
          vendor_id: vendor.id,
          refund_status: { in: [RefundStatus.REFUNDED, RefundStatus.RESOLVED] },
          status: OrderStatus.COMPLETED,
          completed_at: { gte: monthStart },
        },
      }),
    ]);

    const monthTotal = monthOrders.reduce((sum, row) => sum + row._count.status, 0);
    const completedThisMonth = monthRevenue._count.id;
    const completionRate = monthTotal > 0 ? (completedThisMonth / monthTotal) * 100 : 0;
    const refundRate = completedThisMonth > 0 ? (refundCount / completedThisMonth) * 100 : 0;

    const statusCounts = Object.fromEntries(
      monthOrders.map((row) => [row.status, row._count.status])
    );

    return {
      all_time_completed: allCompleted,
      this_month: {
        total_orders: monthTotal,
        completed: completedThisMonth,
        revenue: monthRevenue._sum.total_amount ?? new Decimal(0),
        completion_rate: Math.round(completionRate),
        refund_rate: Math.round(refundRate * 10) / 10,
        by_status: statusCounts,
      },
    };
  }
}
