import { NextFunction, Request, Response } from 'express';
import { AdminProductService } from '@services/admin/adminProductService.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import {
  listAdminProductsQuerySchema,
  adminUpdateProductSchema,
  flagProductSchema,
} from '@validators/adminProductValidator.js';

export class AdminProductController {
  /**
   * GET /api/v1/admin/products
   * List products across all vendors with filters, search, and pagination.
   */
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    const action = 'listProducts';
    const adminId = req.user!.userId;

    const parsed = listAdminProductsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      adminLogger.warn('Invalid query parameters for listProducts', {
        action,
        adminId,
        errors: parsed.error.issues,
      });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const result = await AdminProductService.listProducts(parsed.data, adminId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      adminLogger.error('Failed to list products', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/products/analytics
   * Platform-wide quick stats and top performers.
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    const action = 'getProductAnalytics';
    const adminId = req.user!.userId;

    try {
      const result = await AdminProductService.getAnalytics(adminId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      adminLogger.error('Failed to get product analytics', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/products/:id
   * Product detail including vendor info, recent order items, and sales analytics.
   */
  static async getProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'getProduct';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const product = await AdminProductService.getProductById(id as string, adminId);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      adminLogger.error('Failed to get product detail', {
        action,
        adminId,
        productId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/products/:id
   * Admin full-override edit of any vendor's product.
   */
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'updateProduct';
    const adminId = req.user!.userId;
    const { id } = req.params;

    const parsed = adminUpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const updated = await AdminProductService.updateProduct(id as string, parsed.data, adminId);
      res.status(200).json({ success: true, data: updated, message: 'Product updated successfully.' });
    } catch (error) {
      adminLogger.error('Failed to update product', {
        action,
        adminId,
        productId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/products/:id/flag
   * Flag a product for quality review (non-blocking — stays visible/active).
   */
  static async flagProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'flagProduct';
    const adminId = req.user!.userId;
    const { id } = req.params;

    const parsed = flagProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const updated = await AdminProductService.flagProduct(id as string, parsed.data.reason, adminId);
      res.status(200).json({ success: true, data: updated, message: 'Product flagged for review.' });
    } catch (error) {
      adminLogger.error('Failed to flag product', {
        action,
        adminId,
        productId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/products/:id/approve
   * Clear a product's flag after review.
   */
  static async approveProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'approveProduct';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const updated = await AdminProductService.approveProduct(id as string, adminId);
      res.status(200).json({ success: true, data: updated, message: 'Product approved.' });
    } catch (error) {
      adminLogger.error('Failed to approve product', {
        action,
        adminId,
        productId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/products/:id
   * Admin archive (soft delete) — the only action that removes a product from visibility.
   */
  static async archiveProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'archiveProduct';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const archived = await AdminProductService.archiveProduct(id as string, adminId);
      res.status(200).json({ success: true, data: archived, message: 'Product archived.' });
    } catch (error) {
      adminLogger.error('Failed to archive product', {
        action,
        adminId,
        productId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
