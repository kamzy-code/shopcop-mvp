import { NextFunction, Request, Response } from 'express';
import { ProductService } from '@services/productService.js';
import {
  createProductSchema,
  productFiltersSchema,
  updateProductSchema,
} from '@validators/productValidator.js';
import { productLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class ProductController {
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'createProduct';
    const userId = req.user!.userId;

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      productLogger.warn('Invalid product input', { action, userId, issues: parsed.error.issues });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const product = await ProductService.createProduct(userId, parsed.data);
      productLogger.info('Product created', { action, userId, productId: product.id });
      res
        .status(201)
        .json({ success: true, data: product, message: 'Product created successfully' });
    } catch (error) {
      productLogger.error('Failed to create product', { action, userId, error });
      next(error);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    const action = 'getProducts';
    const userId = req.user!.userId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';

    const parsed = productFiltersSchema.safeParse({ search, page, limit });
    if (!parsed.success) {
      productLogger.warn('Invalid product filters', {
        action,
        userId,
        issues: parsed.error.issues,
      });
      return next(new AppError(`Invalid filters: ${parseZodErrors(parsed.error.issues)}`, 400));
    }
    try {
      const result = await ProductService.getProducts(userId, parsed.data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      productLogger.error('Failed to fetch products', { action, userId, error });
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    const action = 'getProductById';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    try {
      const product = await ProductService.getProductById(id, userId);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      productLogger.error('Failed to fetch product', { action, userId, productId: id, error });
      next(error);
    }
  }

  static async getPublicProductById(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id as string;

    try {
      const product = await ProductService.getPublicProductById(id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'updateProduct';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      productLogger.warn('Invalid update input', { action, userId, issues: parsed.error.issues });
      return next(new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400));
    }

    try {
      const product = await ProductService.updateProduct(id, userId, parsed.data);
      productLogger.info('Product updated', { action, userId, productId: id });
      res
        .status(200)
        .json({ success: true, data: product, message: 'Product updated successfully' });
    } catch (error) {
      productLogger.error('Failed to update product', { action, userId, productId: id, error });
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'deleteProduct';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    try {
      await ProductService.deleteProduct(id, userId);
      productLogger.info('Product deleted', { action, userId, productId: id });
      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      productLogger.error('Failed to delete product', { action, userId, productId: id, error });
      next(error);
    }
  }

  static async duplicateProduct(req: Request, res: Response, next: NextFunction) {
    const action = 'duplicateProduct';
    const userId = req.user!.userId;
    const id = req.params.id as string;

    try {
      const product = await ProductService.duplicateProduct(id, userId);
      productLogger.info('Product duplicated', {
        action,
        userId,
        originalId: id,
        duplicateId: product.id,
      });
      res
        .status(201)
        .json({ success: true, data: product, message: 'Product duplicated successfully' });
    } catch (error) {
      productLogger.error('Failed to duplicate product', { action, userId, productId: id, error });
      next(error);
    }
  }
}
