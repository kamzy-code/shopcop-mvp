import { NextFunction, Request, Response } from 'express';
import { AdminOrderService } from '@services/admin/adminOrderService.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import { listAdminOrdersQuerySchema } from '@validators/adminOrderValidator.js';

export class AdminOrderController {
  /** GET /api/v1/admin/orders — List orders across all vendors with filters, search, pagination. */
  static async listOrders(req: Request, res: Response, next: NextFunction) {
    const action = 'listOrders';
    const adminId = req.user!.userId;

    const parsed = listAdminOrdersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const result = await AdminOrderService.listOrders(parsed.data, adminId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      adminLogger.error('Failed to list orders', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /** GET /api/v1/admin/orders/analytics — Platform-wide order analytics + needing-attention queue. */
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    const action = 'getOrderAnalytics';
    const adminId = req.user!.userId;

    try {
      const result = await AdminOrderService.getAnalytics(adminId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      adminLogger.error('Failed to get order analytics', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /** GET /api/v1/admin/orders/:id — Order detail for admin review. */
  static async getOrder(req: Request, res: Response, next: NextFunction) {
    const action = 'getOrder';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const order = await AdminOrderService.getOrderById(id as string, adminId);
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      adminLogger.error('Failed to get order detail', {
        action,
        adminId,
        orderId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
