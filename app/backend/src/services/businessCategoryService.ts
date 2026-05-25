import { prisma } from '@config/prisma.js';
import { categoryLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/businessCategoryValidator.js';

// ============================================
// BUSINESS CATEGORY SERVICE
// ============================================

export class BusinessCategoryService {
  /**
   * Returns all active business categories ordered by display_order ascending.
   *
   * @returns Array of active BusinessCategory records (may be empty)
   */
  static async getAllCategories() {
    const categories = await prisma.businessCategory.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });

    categoryLogger.info('Fetched all active business categories', {
      action: 'getAllCategories',
      count: categories.length,
    });

    return categories;
  }

  /**
   * Returns a single business category by its ID.
   *
   * @param id - The category's unique ID
   * @returns The BusinessCategory record
   * @throws {AppError} 404 — Category not found
   */
  static async getCategoryById(id: string) {
    const category = await prisma.businessCategory.findUnique({ where: { id } });

    if (!category) {
      categoryLogger.warn('Category not found', { action: 'getCategoryById', id });
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  /**
   * Creates a new business category.
   * Checks for duplicate name and slug before inserting.
   *
   * @param data - Validated category creation payload
   * @returns The newly created BusinessCategory record
   * @throws {AppError} 409 — Category with the same name or slug already exists
   */
  static async createCategory(data: CreateCategoryInput) {
    // Check for duplicate name or slug
    const existing = await prisma.businessCategory.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });

    if (existing) {
      const conflict = existing.name === data.name ? 'name' : 'slug';
      categoryLogger.warn('Duplicate category detected', { action: 'createCategory', conflict, value: data[conflict] });
      throw new AppError(`A category with this ${conflict} already exists`, 409);
    }

    const category = await prisma.businessCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon_url: data.icon_url,
        subcategories: data.subcategories,
        display_order: data.display_order ?? 0,
      },
    });

    categoryLogger.info('Business category created', {
      action: 'createCategory',
      categoryId: category.id,
      name: category.name,
    });

    return category;
  }

  /**
   * Partially updates an existing business category.
   * Checks for duplicate name/slug conflicts if those fields are being changed.
   *
   * @param id - The category's unique ID
   * @param data - Partial update payload (only include fields to change)
   * @returns The updated BusinessCategory record
   * @throws {AppError} 404 — Category not found
   * @throws {AppError} 409 — Updated name or slug conflicts with another category
   */
  static async updateCategory(id: string, data: UpdateCategoryInput) {
    // Confirm category exists
    const existing = await prisma.businessCategory.findUnique({ where: { id } });
    if (!existing) {
      categoryLogger.warn('Category not found for update', { action: 'updateCategory', id });
      throw new AppError('Category not found', 404);
    }

    // Check for conflicts only when name/slug is being changed
    if (data.name || data.slug) {
      const conflict = await prisma.businessCategory.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });

      if (conflict) {
        const field = conflict.name === data.name ? 'name' : 'slug';
        categoryLogger.warn('Conflict on category update', { action: 'updateCategory', field, id });
        throw new AppError(`Another category with this ${field} already exists`, 409);
      }
    }

    const updated = await prisma.businessCategory.update({
      where: { id },
      data,
    });

    categoryLogger.info('Business category updated', {
      action: 'updateCategory',
      categoryId: id,
      fields: Object.keys(data),
    });

    return updated;
  }

  /**
   * Soft-deletes a business category by setting is_active to false.
   * Preserves existing vendor profile references that use this category's name.
   *
   * @param id - The category's unique ID
   * @throws {AppError} 404 — Category not found
   */
  static async deleteCategory(id: string) {
    const existing = await prisma.businessCategory.findUnique({ where: { id } });
    if (!existing) {
      categoryLogger.warn('Category not found for deletion', { action: 'deleteCategory', id });
      throw new AppError('Category not found', 404);
    }

    await prisma.businessCategory.update({
      where: { id },
      data: { is_active: false },
    });

    categoryLogger.info('Business category soft-deleted', {
      action: 'deleteCategory',
      categoryId: id,
      name: existing.name,
    });
  }
}
