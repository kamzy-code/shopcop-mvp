import { NextFunction, Request, Response } from 'express';
import { TransactionService } from '@services/transactionService.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  updateTransactionStatusSchema,
  confirmPaymentSchema,
  cancelTransactionSchema,
  transactionFiltersSchema,
} from '@validators/transactionValidator.js';
import { transactionLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { DeliveryMethod, TransactionStatus } from '../generated/prisma/enums.js';

export class TransactionController {
  // ─── Create ──────────────────────────────────────────────────────────────────

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

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    const action = 'getTransactions';
    const userId = req.user!.userId;

    const parsed = transactionFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
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

  // ─── Update (before CONFIRMED) ────────────────────────────────────────────────

  static async updateTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'updateTransaction';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
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

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    const action = 'updateStatus';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateTransactionStatusSchema.safeParse(req.body);
    if (!parsed.success) {
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

  static async confirmPayment(req: Request, res: Response, next: NextFunction) {
    const action = 'confirmPayment';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = confirmPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
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

  static async cancelTransaction(req: Request, res: Response, next: NextFunction) {
    const action = 'cancelTransaction';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = cancelTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
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

  // ─── Analytics ────────────────────────────────────────────────────────────────

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
