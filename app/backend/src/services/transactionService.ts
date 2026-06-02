import { Decimal } from '@prisma/client/runtime/client';
import { prisma } from '@config/prisma.js';
import { transactionLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { TransactionStatus, RefundStatus, PaymentStatus } from '../generated/prisma/enums.js';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilters,
  PaginationMeta,
} from '../types/transactionTypes.js';
import {
  generateTrackingToken,
  generateTransactionReference,
  calculateSubtotal,
  calculateTotal,
  getStatusTimestampField,
  isTransitionValid,
  NON_CANCELLABLE_STATUSES,
  REFUND_STATUS_SYNC,
} from '@utils/transactionUtils.js';

const TRANSACTION_INCLUDE = {
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
const BUYER_TRANSACTION_INCLUDE = {
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
    },
  },
  status_history: { orderBy: { created_at: 'asc' as const } },
  review: true,
} as const;

export class TransactionService {
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
      transactionLogger.warn('Vendor profile not found', { action: 'getVendorByUserId', userId });
      throw new AppError('Vendor profile not found', 404);
    }
    return vendor;
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  static async createTransaction(userId: string, data: CreateTransactionInput) {
    const vendor = await this.getVendorByUserId(userId);

    if (!vendor.personal_info_complete || !vendor.business_info_complete) {
      transactionLogger.warn('Vendor profile incomplete, cannot create transaction', {
        action: 'createTransaction',
        userId,
        vendorId: vendor.id,
      });
      throw new AppError(
        'Complete your personal and business profile before creating transactions',
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
      generateTransactionReference(vendor.id),
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
            transactionLogger.warn('Catalog product not found during transaction creation', {
              action: 'createTransaction',
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

    const transaction = await prisma.transaction.create({
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
      include: TRANSACTION_INCLUDE,
    });

    transactionLogger.info('Transaction created', {
      transactionId: transaction.id,
      reference: transaction.reference,
      vendorId: vendor.id,
    });

    return transaction;
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  static async getVendorTransactions(userId: string, filters: TransactionFilters) {
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

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),

      prisma.transaction.findMany({
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

    return { transactions, meta };
  }

  // ─── Get single ───────────────────────────────────────────────────────────────

  static async getTransaction(transactionId: string, userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: TRANSACTION_INCLUDE,
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found', {
        action: 'getTransaction',
        userId,
        transactionId,
      });
      throw new AppError('Transaction not found', 404);
    }
    if (transaction.vendor_id !== vendor.id) {
      transactionLogger.warn('Unauthorized transaction access attempt', {
        action: 'getTransaction',
        userId,
        transactionId,
      });
      throw new AppError('Not authorized to view this transaction', 403);
    }

    return transaction;
  }

  // ─── Public tracking ──────────────────────────────────────────────────────────

  static async getTransactionByToken(token: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: token },
      include: BUYER_TRANSACTION_INCLUDE,
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found by tracking token', {
        action: 'getTransactionByToken',
        token,
      });
      throw new AppError('Transaction not found', 404);
    }
    return transaction;
  }

  // ─── Buyer: submit payment proof ──────────────────────────────────────────────

  static async submitPaymentProof(
    token: string,
    data: { buyer_email?: string; payment_proof_url?: string }
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: token },
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found for payment proof submission', {
        action: 'submitPaymentProof',
        token,
      });
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.payment_status !== PaymentStatus.UNPAID) {
      transactionLogger.warn('Payment proof already submitted for transaction', {
        action: 'submitPaymentProof',
        transactionId: transaction.id,
        paymentStatus: transaction.payment_status,
      });
      throw new AppError('Payment proof has already been submitted', 400);
    }

    const updated = await prisma.transaction.update({
      where: { tracking_token: token },
      data: {
        payment_status: PaymentStatus.PROOF_SUBMITTED,
        ...(data.buyer_email && { buyer_email: data.buyer_email }),
        ...(data.payment_proof_url && { payment_proof_url: data.payment_proof_url }),
      },
      include: BUYER_TRANSACTION_INCLUDE,
    });

    transactionLogger.info('Buyer submitted payment proof', { transactionId: updated.id });
    return updated;
  }

  // ─── Update (before CONFIRMED) ────────────────────────────────────────────────

  static async updateTransaction(
    transactionId: string,
    userId: string,
    data: UpdateTransactionInput
  ) {
    const transaction = await this.getTransaction(transactionId, userId);

    if (transaction.status !== TransactionStatus.PENDING) {
      transactionLogger.warn('Attempted to edit non-pending transaction', {
        action: 'updateTransaction',
        userId,
        transactionId,
        status: transaction.status,
      });
      throw new AppError('Transaction can only be edited while PENDING', 400);
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
              transactionLogger.warn('Catalog product not found during transaction update', {
                action: 'updateTransaction',
                userId,
                transactionId,
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

      const existingDeliveryFee = Number(transaction.delivery_fee ?? 0);
      const existingDiscount = Number(transaction.discount_amount ?? 0);
      const deliveryFee = data.delivery_fee ?? existingDeliveryFee;
      const discount = data.discount_amount ?? existingDiscount;
      const total = calculateTotal(subtotal, deliveryFee, discount);

      const updated = await prisma.$transaction(async (tx) => {
        await tx.transactionItem.deleteMany({ where: { transaction_id: transactionId } });
        return tx.transaction.update({
          where: { id: transactionId },
          data: {
            ...metaUpdate,
            subtotal: new Decimal(subtotal),
            total_amount: new Decimal(total),
            items: { create: itemsWithSnapshots },
          },
          include: TRANSACTION_INCLUDE,
        });
      });

      transactionLogger.info('Transaction updated (with items)', { transactionId });
      return updated;
    }

    // ── Metadata-only path ─────────────────────────────────────────────────────
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: metaUpdate,
      include: TRANSACTION_INCLUDE,
    });

    transactionLogger.info('Transaction updated', { transactionId });
    return updated;
  }

  // ─── Confirm payment (stock deduction) ────────────────────────────────────────

  static async confirmPayment(transactionId: string, userId: string, notes?: string) {
    // Unified 404 / 403 check — consistent with all other mutating methods.
    await this.getTransaction(transactionId, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside the transaction for atomic consistency (uses tx client, not prisma).
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true },
      });

      // Safety net: should never fire given the check above, but guards against
      // race conditions where the transaction was deleted between the two fetches.
      if (!transaction) {
        transactionLogger.warn('Transaction not found during payment confirmation (safety net)', {
          action: 'confirmPayment',
          userId,
          transactionId,
        });
        throw new AppError('Transaction not found', 404);
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        transactionLogger.warn('Attempted to confirm payment on non-pending transaction', {
          action: 'confirmPayment',
          userId,
          transactionId,
          status: transaction.status,
        });
        throw new AppError('Only PENDING transactions can have payment confirmed', 400);
      }

      // Deduct stock for each catalog item with inventory tracking
      for (const item of transaction.items) {
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
          transactionLogger.warn('Insufficient stock during payment confirmation', {
            action: 'confirmPayment',
            userId,
            transactionId,
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

        await tx.transactionItem.update({
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
          transactionLogger.warn('Product out of stock after transaction confirmation', {
            productId: product.id,
            productName: product.name,
            vendorId: product.vendor_id,
          });
        } else if (product.low_stock_threshold && newQty <= product.low_stock_threshold) {
          //Send notification later

          transactionLogger.warn('Product low stock after transaction confirmation', {
            productId: product.id,
            productName: product.name,
            vendorId: product.vendor_id,
            remaining: newQty,
          });
        }
      }

      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.CONFIRMED,
          payment_status: 'PAID',
          confirmed_at: new Date(),
          payment_confirmed_at: new Date(),
          payment_notes: notes || null,
        },
        include: TRANSACTION_INCLUDE,
      });

      await tx.transactionStatusHistory.create({
        data: {
          transaction_id: transactionId,
          from_status: TransactionStatus.PENDING,
          to_status: TransactionStatus.CONFIRMED,
          changed_by: userId,
          note: notes || 'Payment confirmed by vendor',
        },
      });

      return updated;
    });

    transactionLogger.info('Payment confirmed, stock deducted', {
      transactionId,
      reference: result.reference,
    });

    return result;
  }

  // ─── Update status ────────────────────────────────────────────────────────────

  static async updateTransactionStatus(
    transactionId: string,
    userId: string,
    newStatus: TransactionStatus,
    note?: string
  ) {
    const transaction = await this.getTransaction(transactionId, userId);

    if (!isTransitionValid(transaction.status, newStatus)) {
      transactionLogger.warn('Invalid transaction status transition', {
        action: 'updateTransactionStatus',
        userId,
        transactionId,
        fromStatus: transaction.status,
        toStatus: newStatus,
      });
      throw new AppError(`Cannot transition from ${transaction.status} to ${newStatus}`, 400);
    }

    const timestampField = getStatusTimestampField(newStatus);
    const timestampData = timestampField ? { [timestampField]: new Date() } : {};

    // Set auto_close_at 48 hours after DELIVERED
    const autoCloseData =
      newStatus === TransactionStatus.DELIVERED
        ? { auto_close_at: new Date(Date.now() + 48 * 60 * 60 * 1000) }
        : {};

    // Sync refund_status so it persists the refund outcome even after status → COMPLETED
    const refundStatusSync = REFUND_STATUS_SYNC[newStatus];
    const refundStatusData =
      refundStatusSync !== undefined ? { refund_status: refundStatusSync } : {};

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: newStatus,
          ...timestampData,
          ...autoCloseData,
          ...refundStatusData,
        },
        include: TRANSACTION_INCLUDE,
      });

      await tx.transactionStatusHistory.create({
        data: {
          transaction_id: transactionId,
          from_status: transaction.status,
          to_status: newStatus,
          changed_by: userId,
          note: note || null,
        },
      });

      return updated;
    });

    transactionLogger.info('Transaction status updated', {
      transactionId,
      from: transaction.status,
      to: newStatus,
    });

    return result;
  }

  // ─── Cancel transaction (with stock restoration) ──────────────────────────────

  static async cancelTransaction(transactionId: string, userId: string, reason: string) {
    // Unified 404 / 403 check — consistent with all other mutating methods.
    await this.getTransaction(transactionId, userId);

    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch inside the transaction for atomic consistency.
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true },
      });

      // Safety net only — ownership already verified above.
      if (!transaction) {
        transactionLogger.warn('Transaction not found during cancellation (safety net)', {
          action: 'cancelTransaction',
          userId,
          transactionId,
        });
        throw new AppError('Transaction not found', 404);
      }

      if (NON_CANCELLABLE_STATUSES.includes(transaction.status)) {
        transactionLogger.warn('Attempted to cancel non-cancellable transaction', {
          action: 'cancelTransaction',
          userId,
          transactionId,
          status: transaction.status,
        });
        throw new AppError(`Cannot cancel a transaction in ${transaction.status} status`, 400);
      }

      // Restore stock for items that had stock deducted
      for (const item of transaction.items) {
        if (item.stock_deducted <= 0 || !item.product_id) continue;

        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { increment: item.stock_deducted } },
        });

        await tx.transactionItem.update({
          where: { id: item.id },
          data: {
            stock_restored: item.stock_deducted,
            stock_deducted: 0,
          },
        });
      }

      const cancelled = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.CANCELLED,
          cancelled_by: userId,
          cancellation_reason: reason,
          cancelled_at: new Date(),
        },
        include: TRANSACTION_INCLUDE,
      });

      await tx.transactionStatusHistory.create({
        data: {
          transaction_id: transactionId,
          from_status: transaction.status,
          to_status: TransactionStatus.CANCELLED,
          changed_by: userId,
          note: reason,
        },
      });

      return cancelled;
    });

    transactionLogger.info('Transaction cancelled, stock restored', {
      transactionId,
      reference: result.reference,
    });

    return result;
  }

  // ─── Buyer: cancel transaction by token ───────────────────────────────────────

  static async buyerCancelTransaction(token: string, reason: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: token },
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found for buyer cancellation', {
        action: 'buyerCancelTransaction',
        token,
      });
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      transactionLogger.warn('Cannot cancel non-PENDING transaction as buyer', {
        action: 'buyerCancelTransaction',
        transactionId: transaction.id,
        status: transaction.status,
      });
      throw new AppError('Only pending orders can be cancelled', 400);
    }

    const cancelled = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.CANCELLED,
        cancelled_by: 'buyer',
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
      include: BUYER_TRANSACTION_INCLUDE,
    });

    await prisma.transactionStatusHistory.create({
      data: {
        transaction_id: transaction.id,
        from_status: transaction.status,
        to_status: TransactionStatus.CANCELLED,
        changed_by: 'buyer',
        note: reason,
      },
    });

    transactionLogger.info('Buyer cancelled transaction', { transactionId: transaction.id, token });

    const { vendor_notes: _omit, ...buyerSafe } = cancelled;
    void _omit;
    return buyerSafe;
  }

  // ─── Buyer: confirm delivery by token ─────────────────────────────────────────

  static async buyerConfirmDelivery(token: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: token },
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found for buyer delivery confirmation', {
        action: 'buyerConfirmDelivery',
        token,
      });
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== TransactionStatus.DELIVERED) {
      transactionLogger.warn('Cannot confirm delivery — transaction not DELIVERED', {
        action: 'buyerConfirmDelivery',
        transactionId: transaction.id,
        status: transaction.status,
      });
      throw new AppError('Only delivered orders can be confirmed as received', 400);
    }

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.COMPLETED,
        completed_at: new Date(),
      },
      include: BUYER_TRANSACTION_INCLUDE,
    });

    await prisma.transactionStatusHistory.create({
      data: {
        transaction_id: transaction.id,
        from_status: transaction.status,
        to_status: TransactionStatus.COMPLETED,
        changed_by: 'buyer',
        note: 'Buyer confirmed delivery',
      },
    });

    transactionLogger.info('Buyer confirmed delivery', { transactionId: transaction.id, token });

    const { vendor_notes: _omit, ...buyerSafe } = updated;
    void _omit;
    return buyerSafe;
  }

  // ─── Buyer: request refund by token ──────────────────────────────────────────

  static async buyerRequestRefund(token: string, reason: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { tracking_token: token },
    });

    if (!transaction) {
      transactionLogger.warn('Transaction not found for buyer refund request', {
        action: 'buyerRequestRefund',
        token,
      });
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.status !== TransactionStatus.DELIVERED && transaction.status !== TransactionStatus.COMPLETED) {
      transactionLogger.warn('Cannot request refund — transaction not DELIVERED or COMPLETED', {
        action: 'buyerRequestRefund',
        transactionId: transaction.id,
        status: transaction.status,
      });
      throw new AppError('Refund can only be requested for delivered or completed orders', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.REFUND_REQUESTED,
          refund_status: RefundStatus.REQUESTED,
          refund_initiated_at: new Date(),
          refund_reason: reason,
        },
        include: BUYER_TRANSACTION_INCLUDE,
      });

      await tx.transactionStatusHistory.create({
        data: {
          transaction_id: transaction.id,
          from_status: transaction.status,
          to_status: TransactionStatus.REFUND_REQUESTED,
          changed_by: 'buyer',
          note: reason,
        },
      });

      return result;
    });

    transactionLogger.info('Buyer requested refund', { transactionId: transaction.id, token });

    const { vendor_notes: _omit, ...buyerSafe } = updated;
    void _omit;
    return buyerSafe;
  }

  // ─── Update status with refund data ───────────────────────────────────────────

  static async updateTransactionStatusWithRefund(
    transactionId: string,
    userId: string,
    newStatus: TransactionStatus,
    note?: string,
    refundAmount?: number,
    refundVendorNotes?: string,
  ) {
    const transaction = await this.getTransaction(transactionId, userId);

    if (!isTransitionValid(transaction.status, newStatus)) {
      transactionLogger.warn('Invalid transaction status transition', {
        action: 'updateTransactionStatusWithRefund',
        userId,
        transactionId,
        fromStatus: transaction.status,
        toStatus: newStatus,
      });
      throw new AppError(`Cannot transition from ${transaction.status} to ${newStatus}`, 400);
    }

    const timestampField = getStatusTimestampField(newStatus);
    const timestampData = timestampField ? { [timestampField]: new Date() } : {};

    const autoCloseData =
      newStatus === TransactionStatus.DELIVERED
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
      const updated = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: newStatus,
          ...timestampData,
          ...autoCloseData,
          ...refundStatusData,
          ...refundData,
        },
        include: TRANSACTION_INCLUDE,
      });

      await tx.transactionStatusHistory.create({
        data: {
          transaction_id: transactionId,
          from_status: transaction.status,
          to_status: newStatus,
          changed_by: userId,
          note: note || null,
        },
      });

      return updated;
    });

    transactionLogger.info('Transaction status updated with refund info', {
      transactionId,
      from: transaction.status,
      to: newStatus,
    });

    return result;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  static async getAnalyticsSummary(userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allCompleted, monthTransactions, monthRevenue, refundCount] = await Promise.all([
      prisma.transaction.count({
        where: { vendor_id: vendor.id, status: TransactionStatus.COMPLETED },
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        where: { vendor_id: vendor.id, created_at: { gte: monthStart } },
        _count: { status: true },
      }),
      prisma.transaction.aggregate({
        where: {
          vendor_id: vendor.id,
          status: TransactionStatus.COMPLETED,
          completed_at: { gte: monthStart },
        },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      prisma.transaction.count({
        where: {
          vendor_id: vendor.id,
          refund_status: { in: [RefundStatus.REFUNDED, RefundStatus.RESOLVED] },
          status: TransactionStatus.COMPLETED,
          completed_at: { gte: monthStart },
        },
      }),
    ]);

    const monthTotal = monthTransactions.reduce((sum, row) => sum + row._count.status, 0);
    const completedThisMonth = monthRevenue._count.id;
    const completionRate = monthTotal > 0 ? (completedThisMonth / monthTotal) * 100 : 0;
    const refundRate = completedThisMonth > 0 ? (refundCount / completedThisMonth) * 100 : 0;

    const statusCounts = Object.fromEntries(
      monthTransactions.map((row) => [row.status, row._count.status])
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
