import { NextFunction, Request, Response } from 'express';
import { BusinessCategoryService } from '@services/businessCategoryService.js';
import { createCategorySchema, updateCategorySchema } from '../validators/businessCategoryValidator.js';
import { categoryLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';

export class BusinessCategoryController {
  /**
   * GET /api/v1/categories
   * Returns all active business categories ordered by display_order.
   * Public endpoint — no authentication required.
   *
   * @returns 200 `{ success: true, data: BusinessCategory[] }`
   */
  static async getAllCategories(req: Request, res: Response, next: NextFunction) {
    const action = 'getAllCategories';

    try {
      const categories = await BusinessCategoryService.getAllCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      categoryLogger.error('Failed to fetch business categories', {
        action,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/categories/:id
   * Returns a single business category by ID.
   * Public endpoint — no authentication required.
   *
   * @param req.params.id - Category ID
   * @returns 200 `{ success: true, data: BusinessCategory }`
   * @throws {AppError} 404 — Category not found
   */
  static async getCategoryById(req: Request, res: Response, next: NextFunction) {
    const action = 'getCategoryById';
    const { id } = req.params;

    try {
      const category = await BusinessCategoryService.getCategoryById(id as string);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      categoryLogger.error('Failed to fetch category by id', {
        action,
        categoryId: id,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * POST /api/v1/categories
   * Creates a new business category. Admin only.
   *
   * @param req.body.name - Category name (unique)
   * @param req.body.slug - URL slug (unique, lowercase, hyphens only)
   * @param req.body.subcategories - Array of subcategory name strings (1–20)
   * @param req.body.description - Optional description
   * @param req.body.icon_url - Optional icon URL
   * @param req.body.display_order - Optional display order (defaults to 0)
   * @returns 201 `{ success: true, data: BusinessCategory, message }`
   * @throws {AppError} 400 — Validation failure
   * @throws {AppError} 409 — Name or slug already exists
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    const action = 'createCategory';
    const adminId = req.user!.userId;

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      categoryLogger.warn('Invalid category creation input', {
        action,
        adminId,
        issues: parsed.error.issues,
      });
      throw new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const category = await BusinessCategoryService.createCategory(parsed.data);

      categoryLogger.info('Category created by admin', { action, adminId, categoryId: category.id });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      categoryLogger.error('Failed to create category', {
        action,
        adminId,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/categories/:id
   * Partially updates an existing business category. Admin only.
   *
   * @param req.params.id - Category ID to update
   * @param req.body - Partial fields to update (any subset of createCategorySchema)
   * @returns 200 `{ success: true, data: BusinessCategory, message }`
   * @throws {AppError} 400 — Validation failure
   * @throws {AppError} 404 — Category not found
   * @throws {AppError} 409 — Name or slug conflicts with another category
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    const action = 'updateCategory';
    const adminId = req.user!.userId;
    const { id } = req.params;

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      categoryLogger.warn('Invalid category update input', {
        action,
        adminId,
        categoryId: id,
        issues: parsed.error.issues,
      });
      throw new AppError(`Invalid input: ${parseZodErrors(parsed.error.issues)}`, 400);
    }

    try {
      const category = await BusinessCategoryService.updateCategory(id as string, parsed.data);

      categoryLogger.info('Category updated by admin', { action, adminId, categoryId: id });

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error) {
      categoryLogger.error('Failed to update category', {
        action,
        adminId,
        categoryId: id,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * DELETE /api/v1/categories/:id
   * Soft-deletes a business category (sets is_active = false). Admin only.
   * Does not hard-delete to preserve existing vendor profile references.
   *
   * @param req.params.id - Category ID to delete
   * @returns 200 `{ success: true, message }`
   * @throws {AppError} 404 — Category not found
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    const action = 'deleteCategory';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      await BusinessCategoryService.deleteCategory(id as string);

      categoryLogger.info('Category soft-deleted by admin', { action, adminId, categoryId: id });

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      categoryLogger.error('Failed to delete category', {
        action,
        adminId,
        categoryId: id,
        error: error instanceof AppError ? error.message : error,
      });
      next(error);
    }
  }
}
