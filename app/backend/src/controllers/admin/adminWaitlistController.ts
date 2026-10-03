import { NextFunction, Request, Response } from 'express';
import { AdminWaitlistService } from '@services/admin/adminWaitlistService.js';
import { listWaitlistQuerySchema, updateWaitlistStatusSchema } from '../../validators/adminWaitlistValidator.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class AdminWaitlistController {
  /**
   * GET /api/v1/admin/waitlist
   * Lists waitlist entries with optional filters (status, user_type, open_to_chat, search)
   * and pagination (page, limit).
   */
  static async listWaitlistEntries(req: Request, res: Response, next: NextFunction) {
    const action = 'listWaitlistEntries';
    const adminId = req.user!.userId;

    const parsed = listWaitlistQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      adminLogger.warn('Invalid waitlist list query', {
        action,
        adminId,
        issues: parsed.error.issues,
      });
      throw new AppError(`Invalid query: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const result = await AdminWaitlistService.listWaitlistEntries(parsed.data);
      res.status(200).json({
        success: true,
        data: result.entries,
        pagination: result.pagination,
      });
    } catch (error) {
      adminLogger.error('Failed to list waitlist entries', {
        action,
        adminId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/waitlist/:id
   * Retrieves a single waitlist entry.
   */
  static async getWaitlistEntry(req: Request, res: Response, next: NextFunction) {
    const action = 'getWaitlistEntry';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const entry = await AdminWaitlistService.getWaitlistEntry(id as string);
      res.status(200).json({ success: true, data: entry });
    } catch (error) {
      adminLogger.error('Failed to get waitlist entry', {
        action,
        adminId,
        waitlistId: id,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/waitlist/:id/status
   * Updates the follow-up status of a waitlist entry. Admin only.
   */
  static async updateWaitlistStatus(req: Request, res: Response, next: NextFunction) {
    const action = 'updateWaitlistStatus';
    const adminId = req.user!.userId;
    const { id } = req.params;

    const parsed = updateWaitlistStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      adminLogger.warn('Invalid waitlist status update', {
        action,
        adminId,
        waitlistId: id,
        issues: parsed.error.issues,
      });
      throw new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const entry = await AdminWaitlistService.updateWaitlistStatus(
        id as string,
        adminId,
        parsed.data,
      );

      res.status(200).json({
        success: true,
        data: entry,
        message: 'Waitlist status updated successfully',
      });
    } catch (error) {
      adminLogger.error('Failed to update waitlist status', {
        action,
        adminId,
        waitlistId: id,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}