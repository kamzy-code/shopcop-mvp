import { NextFunction, Request, Response } from 'express';
import { TransactionService } from '@services/transactionService.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  updateTransactionStatusSchema,
  confirmPaymentSchema,
  cancelTransactionSchema,
  transactionFiltersSchema,
  submitPaymentProofSchema,
  buyerCancelTransactionSchema,
  confirmDeliverySchema,
  updateRefundStatusSchema,
  buyerRefundRequestSchema,
} from '@validators/transactionValidator.js';
import { transactionLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { DeliveryMethod, TransactionStatus } from '../generated/prisma/enums.js';

export class TransactionController {
  // ─── Create ──────────────────────────────────────────────────────────────────

  /**
   * Create a new transaction with items.
   * Validates input via Zod, snapshots catalog product details, and generates a reference and tracking token.
   *
   * @route  POST /api/v1/transactions
   * @access Vendor (authenticated)
   * @param req.body.delivery_method - PICKUP | DISPATCH | WAYBILL
   * @param req.body.items - Array of line items (min 1)
   * @param req.body.buyer_email - Buyer's email for order notifications (optional)
   * @param req.body.expected_delivery_start - Start of delivery window (optional)
   * @param req.body.expected_delivery_end - End of delivery window (optional)
   * @param req.body.delivery_fee - Delivery fee in Naira (default 0)
   * @param req.body.discount_amount - Discount in Naira (default 0)
   * @param req.body.order_notes - Notes visible to buyer (optional)
   * @param req.body.vendor_notes - Internal notes (optional)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 201 `{ success, data: Transaction, message }`
   * @throws {AppError} 400 — Invalid input or profile incomplete
   * @throws {AppError} 404 — Vendor profile not found
   */
  static async createTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'createTransaction';
    const userId = req.user!.userId;

    const parsed = createTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid transaction input', {
        action,
        userId,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.createTransaction(userId, {
        ...parsed.data,
        buyer_email: parsed.data.buyer_email || undefined,
      });
      transactionLogger.info('Transaction created', {
        action,
        userId,
        transactionId: transaction.id,
      });
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      transactionLogger.error('Failed to create transaction', { action, userId, error });
      next(error);
    }
  }

  // ─── List ─────────────────────────────────────────────────────────────────────

  /**
   * List the vendor's transactions with filtering, sorting, and pagination.
   *
   * @route  GET /api/v1/transactions
   * @access Vendor (authenticated)
   * @param req.query.status - Filter by transaction status
   * @param req.query.refund_status - Filter by refund status
   * @param req.query.payment_status - Filter by payment status
   * @param req.query.search - Search buyer_email or reference
   * @param req.query.page - Page number (default 1)
   * @param req.query.limit - Results per page (default 20, max 100)
   * @param req.query.sort - Sort order: newest | oldest | amount_asc | amount_desc
   * @param req.query.from_date - Filter from date
   * @param req.query.to_date - Filter to date
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction[], meta: PaginationMeta }`
   * @throws {AppError} 400 — Invalid filter input
   */
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    const action = 'getTransactions';
    const userId = req.user!.userId;

    const parsed = transactionFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      transactionLogger.warn('Invalid transaction filters', {
        action,
        userId,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid filters: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const { transactions, meta } = await TransactionService.getVendorTransactions(
        userId,
        parsed.data
      );
      res.status(200).json({ success: true, data: transactions, meta });
    } catch (error) {
      transactionLogger.error('Failed to fetch transactions', { action, userId, error });
      next(error);
    }
  }

  // ─── Get single ───────────────────────────────────────────────────────────────

  /**
   * Get a single transaction by ID. Verifies vendor ownership.
   *
   * @route  GET /api/v1/transactions/:id
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction }`
   * @throws {AppError} 404 — Transaction not found
   * @throws {AppError} 403 — Not authorized to view this transaction
   */
  static async getTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'getTransaction';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    try {
      const transaction = await TransactionService.getTransaction(id, userId);
      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      transactionLogger.error('Failed to fetch transaction', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Public tracking (no auth) ────────────────────────────────────────────────

  /**
   * Get a transaction by tracking token (public). Strips vendor_notes from the response.
   *
   * @route  GET /api/v1/track/:token
   * @access Public
   * @param req.params.token - Tracking token from the shareable link
   * @returns 200 `{ success, data: Transaction (buyer-safe, no vendor_notes) }`
   * @throws {AppError} 404 — Transaction not found
   */
  static async getTransactionByToken(req: Request, res: Response, next: NextFunction) {
    const token = req.params.token as string;

    try {
      const transaction = await TransactionService.getTransactionByToken(token);

      const { vendor_notes: _omit, ...buyerSafe } = transaction;
      void _omit;

      res.status(200).json({ success: true, data: buyerSafe });
    } catch (error) {
      next(error);
    }
  }

  // ─── Buyer: submit payment proof (public) ────────────────────────────────────

  /**
   * Submit payment proof for an UNPAID transaction (public).
   *
   * @route  POST /api/v1/track/:token/submit-payment
   * @access Public
   * @param req.params.token - Tracking token from the shareable link
   * @param req.body.buyer_email - Buyer's email (optional)
   * @param req.body.payment_proof_url - URL of the payment proof screenshot (optional)
   * @returns 200 `{ success, data: Transaction (buyer-safe), message }`
   * @throws {AppError} 400 — Invalid input or proof already submitted
   * @throws {AppError} 404 — Transaction not found
   */
  static async submitPaymentProof(req: Request, res: Response, next: NextFunction) {
    const action = 'submitPaymentProof';
    const token = req.params.token as string;

    const parsed = submitPaymentProofSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid payment proof input', {
        action,
        token,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.submitPaymentProof(token, {
        buyer_email: parsed.data.buyer_email || undefined,
        payment_proof_url: parsed.data.payment_proof_url || undefined,
      });

      const { vendor_notes: _omit, ...buyerSafe } = transaction as typeof transaction & { vendor_notes?: unknown };
      void _omit;

      transactionLogger.info('Payment proof submitted', {
        action,
        token,
        transactionId: transaction.id,
        hasProofUrl: !!parsed.data.payment_proof_url,
        hasBuyerEmail: !!parsed.data.buyer_email,
      });

      res.status(200).json({
        success: true,
        data: buyerSafe,
        message: 'Payment proof submitted successfully',
      });
    } catch (error) {
      transactionLogger.error('Failed to submit payment proof', { action, token, error });
      next(error);
    }
  }

  // ─── Update (before CONFIRMED) ────────────────────────────────────────────────

  /**
   * Update transaction metadata, items, or both. Only allowed while PENDING.
   * Providing an items array replaces all existing items.
   *
   * @route  PATCH /api/v1/transactions/:id
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.body.buyer_email - Buyer's email (optional)
   * @param req.body.delivery_method - PICKUP | DISPATCH | WAYBILL (optional)
   * @param req.body.items - Replacement items array (optional)
   * @param req.body.delivery_fee - Delivery fee (optional)
   * @param req.body.discount_amount - Discount amount (optional)
   * @param req.body.order_notes - Notes visible to buyer (optional)
   * @param req.body.vendor_notes - Internal notes (optional)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction, message }`
   * @throws {AppError} 400 — Invalid input or transaction not in PENDING status
   * @throws {AppError} 404 — Transaction not found
   * @throws {AppError} 403 — Not authorized
   */
  static async updateTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'updateTransaction';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid transaction update input', {
        action,
        userId,
        transactionId: id,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.updateTransaction(id, userId, {
        ...parsed.data,
        delivery_method: parsed.data.delivery_method as DeliveryMethod | undefined,
      });
      transactionLogger.info('Transaction updated', { action, userId, transactionId: id });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction updated successfully',
      });
    } catch (error) {
      transactionLogger.error('Failed to update transaction', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Status update ────────────────────────────────────────────────────────────

  /**
   * Advance the transaction along the valid state machine.
   * CONFIRMED and CANCELLED transitions are handled by dedicated endpoints (confirmPayment / cancelTransaction).
   *
   * @route  PATCH /api/v1/transactions/:id/status
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.body.status - Target status (IN_PROGRESS | READY_FOR_DISPATCH | SHIPPED | DELIVERED | COMPLETED | REFUND_REQUESTED | REFUND_IN_PROGRESS | REFUNDED | RESOLVED)
   * @param req.body.note - Optional note for the status history
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction, message }`
   * @throws {AppError} 400 — Invalid input or invalid status transition
   * @throws {AppError} 404 — Transaction not found
   * @throws {AppError} 403 — Not authorized
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    const action = 'updateStatus';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateTransactionStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid status update input', {
        action,
        userId,
        transactionId: id,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.updateTransactionStatus(
        id,
        userId,
        parsed.data.status as TransactionStatus,
        parsed.data.note
      );
      transactionLogger.info('Transaction status updated', {
        action,
        userId,
        transactionId: id,
        status: parsed.data.status,
      });
      res.status(200).json({
        success: true,
        data: transaction,
        message: `Status updated to ${parsed.data.status}`,
      });
    } catch (error) {
      transactionLogger.error('Failed to update status', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Confirm payment ──────────────────────────────────────────────────────────

  /**
   * Confirm payment for a PENDING transaction. Deducts stock for catalog items and sets status to CONFIRMED.
   *
   * @route  PATCH /api/v1/transactions/:id/confirm-payment
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.body.payment_notes - Optional notes about the payment
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction, message }`
   * @throws {AppError} 400 — Invalid input, transaction not PENDING, or insufficient stock
   * @throws {AppError} 404 — Transaction not found
   * @throws {AppError} 403 — Not authorized
   */
  static async confirmPayment(req: Request, res: Response, next: NextFunction) {
    const action = 'confirmPayment';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = confirmPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid payment confirmation input', {
        action,
        userId,
        transactionId: id,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.confirmPayment(
        id,
        userId,
        parsed.data.payment_notes
      );
      transactionLogger.info('Payment confirmed', { action, userId, transactionId: id });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Payment confirmed and stock updated',
      });
    } catch (error) {
      transactionLogger.error('Failed to confirm payment', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────────

  /**
   * Cancel a cancellable transaction. Restores deducted stock for all items.
   *
   * @route  DELETE /api/v1/transactions/:id
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.body.reason - Cancellation reason (min 10 characters)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: Transaction, message }`
   * @throws {AppError} 400 — Invalid input or transaction not cancellable in current status
   * @throws {AppError} 404 — Transaction not found
   * @throws {AppError} 403 — Not authorized
   */
  static async cancelTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'cancelTransaction';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = cancelTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid cancel transaction input', {
        action,
        userId,
        transactionId: id,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.cancelTransaction(
        id,
        userId,
        parsed.data.reason
      );
      transactionLogger.info('Transaction cancelled', { action, userId, transactionId: id });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Transaction cancelled and stock restored',
      });
    } catch (error) {
      transactionLogger.error('Failed to cancel transaction', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Buyer: cancel by token ───────────────────────────────────────────────────

  /**
   * Cancel a PENDING transaction via tracking token (buyer-side).
   *
   * @route  POST /api/v1/track/:token/cancel
   * @access Public (token-based)
   * @param req.params.token - Tracking token from the shareable link
   * @param req.body.reason - Cancellation reason (min 10 characters)
   * @returns 200 `{ success, data: Transaction (buyer-safe), message }`
   * @throws {AppError} 400 — Invalid input or not PENDING
   * @throws {AppError} 404 — Transaction not found
   */
  static async buyerCancelTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'buyerCancelTransaction';
    const token = req.params.token as string;

    const parsed = buyerCancelTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid buyer cancel input', {
        action,
        token,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.buyerCancelTransaction(
        token,
        parsed.data.reason
      );
      transactionLogger.info('Buyer cancelled transaction', { action, token });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      transactionLogger.error('Failed to cancel transaction as buyer', { action, token, error });
      next(error);
    }
  }

  // ─── Buyer: confirm delivery by token ─────────────────────────────────────────

  /**
   * Confirm delivery for a DELIVERED transaction via tracking token (buyer-side).
   *
   * @route  POST /api/v1/track/:token/confirm-delivery
   * @access Public (token-based)
   * @param req.params.token - Tracking token from the shareable link
   * @returns 200 `{ success, data: Transaction (buyer-safe), message }`
   * @throws {AppError} 400 — Invalid input or not DELIVERED
   * @throws {AppError} 404 — Transaction not found
   */
  static async buyerConfirmDelivery(req: Request, res: Response, next: NextFunction) {
    const action = 'buyerConfirmDelivery';
    const token = req.params.token as string;

    const parsed = confirmDeliverySchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid confirm delivery input', {
        action,
        token,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.buyerConfirmDelivery(token);
      transactionLogger.info('Buyer confirmed delivery', { action, token });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Delivery confirmed. Order completed!',
      });
    } catch (error) {
      transactionLogger.error('Failed to confirm delivery as buyer', { action, token, error });
      next(error);
    }
  }

  // ─── Buyer: close a REFUNDED or RESOLVED transaction ─────────────────────────

  static async buyerCloseResolution(req: Request, res: Response, next: NextFunction) {
    const action = 'buyerCloseResolution';
    const token = req.params.token as string;

    try {
      const transaction = await TransactionService.buyerCloseResolution(token);
      transactionLogger.info('Buyer closed resolution', { action, token });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Order closed successfully.',
      });
    } catch (error) {
      transactionLogger.error('Failed to close resolution as buyer', { action, token, error });
      next(error);
    }
  }

  // ─── Buyer: request refund by token ───────────────────────────────────────────

  /**
   * Request a refund for a DELIVERED or COMPLETED transaction via tracking token.
   *
   * @route  POST /api/v1/track/:token/request-refund
   * @access Public (token-based)
   * @param req.params.token - Tracking token
   * @param req.body.reason - Refund reason (min 10 characters)
   * @returns 200 `{ success, data: Transaction (buyer-safe), message }`
   */
  static async buyerRequestRefund(req: Request, res: Response, next: NextFunction) {
    const action = 'buyerRequestRefund';
    const token = req.params.token as string;

    const parsed = buyerRefundRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid buyer refund request input', {
        action,
        token,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.buyerRequestRefund(
        token,
        parsed.data.reason
      );
      transactionLogger.info('Buyer requested refund', { action, token });
      res.status(200).json({
        success: true,
        data: transaction,
        message: 'Refund requested successfully',
      });
    } catch (error) {
      transactionLogger.error('Failed to request refund as buyer', { action, token, error });
      next(error);
    }
  }

  // ─── Status update (with refund fields) ───────────────────────────────────────

  /**
   * Advance status with optional refund_amount and refund_vendor_notes.
   *
   * @route  PATCH /api/v1/transactions/:id/refund-status
   * @access Vendor (authenticated)
   * @param req.params.id - Transaction ID
   * @param req.body.status - Target status
   * @param req.body.note - Optional note
   * @param req.body.refund_amount - Optional refund amount
   * @param req.body.refund_vendor_notes - Optional internal notes about refund
   * @returns 200 `{ success, data: Transaction, message }`
   */
  static async updateRefundStatus(req: Request, res: Response, next: NextFunction) {
    const action = 'updateRefundStatus';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateRefundStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      transactionLogger.warn('Invalid refund status update input', {
        action,
        userId,
        transactionId: id,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const transaction = await TransactionService.updateTransactionStatusWithRefund(
        id,
        userId,
        parsed.data.status as TransactionStatus,
        parsed.data.note,
        parsed.data.refund_amount,
        parsed.data.refund_vendor_notes,
      );
      transactionLogger.info('Refund status updated', {
        action,
        userId,
        transactionId: id,
        status: parsed.data.status,
      });
      res.status(200).json({
        success: true,
        data: transaction,
        message: `Status updated to ${parsed.data.status}`,
      });
    } catch (error) {
      transactionLogger.error('Failed to update refund status', {
        action,
        userId,
        transactionId: id,
        error,
      });
      next(error);
    }
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  /**
   * Get monthly and all-time analytics for the vendor's transactions.
   *
   * @route  GET /api/v1/transactions/analytics/summary
   * @access Vendor (authenticated)
   * @param req.user.userId - Authenticated user's ID (set by auth middleware)
   * @returns 200 `{ success, data: { all_time_completed, this_month: { total_orders, completed, revenue, completion_rate, refund_rate, by_status } } }`
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    const action = 'getAnalytics';
    const userId = req.user!.userId;

    try {
      const summary = await TransactionService.getAnalyticsSummary(userId);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      transactionLogger.error('Failed to fetch analytics', { action, userId, error });
      next(error);
    }
  }
}
