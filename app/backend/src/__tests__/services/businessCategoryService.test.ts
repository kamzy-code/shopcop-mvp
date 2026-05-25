import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    businessCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { BusinessCategoryService } from '@services/businessCategoryService.js';
import { prisma } from '@config/prisma.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── Fixtures ──────────────────────────────────────────────────────────────

const baseCategoryData = {
  name: 'Fashion',
  slug: 'fashion',
  subcategories: ['Clothing', 'Footwear', 'Accessories'],
  description: 'All things fashion',
  icon_url: null,
  display_order: 0,
};

const savedCategory = {
  id: 'cat-1',
  ...baseCategoryData,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

// ─── getAllCategories ───────────────────────────────────────────────────────

describe('BusinessCategoryService.getAllCategories', () => {
  it('returns all active categories ordered by display_order', async () => {
    mockPrisma.businessCategory.findMany.mockResolvedValue([savedCategory]);

    const result = await BusinessCategoryService.getAllCategories();

    expect(mockPrisma.businessCategory.findMany).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Fashion');
  });

  it('returns empty array when no active categories exist', async () => {
    mockPrisma.businessCategory.findMany.mockResolvedValue([]);

    const result = await BusinessCategoryService.getAllCategories();

    expect(result).toEqual([]);
  });
});

// ─── getCategoryById ───────────────────────────────────────────────────────

describe('BusinessCategoryService.getCategoryById', () => {
  it('returns the category when found', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(savedCategory);

    const result = await BusinessCategoryService.getCategoryById('cat-1');

    expect(mockPrisma.businessCategory.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(result.name).toBe('Fashion');
  });

  it('throws 404 when category does not exist', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(null);

    await expect(BusinessCategoryService.getCategoryById('missing-id')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Category not found',
    });
  });
});

// ─── createCategory ────────────────────────────────────────────────────────

describe('BusinessCategoryService.createCategory', () => {
  it('creates and returns the new category with valid data', async () => {
    mockPrisma.businessCategory.findFirst.mockResolvedValue(null); // no conflict
    mockPrisma.businessCategory.create.mockResolvedValue(savedCategory);

    const result = await BusinessCategoryService.createCategory(baseCategoryData);

    expect(mockPrisma.businessCategory.findFirst).toHaveBeenCalledOnce();
    expect(mockPrisma.businessCategory.create).toHaveBeenCalledOnce();
    expect(result.slug).toBe('fashion');
  });

  it('throws 409 when a category with the same name already exists', async () => {
    mockPrisma.businessCategory.findFirst.mockResolvedValue({ ...savedCategory, slug: 'other-slug' });

    await expect(BusinessCategoryService.createCategory(baseCategoryData)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(mockPrisma.businessCategory.create).not.toHaveBeenCalled();
  });

  it('throws 409 when a category with the same slug already exists', async () => {
    mockPrisma.businessCategory.findFirst.mockResolvedValue({
      ...savedCategory,
      name: 'Different Name',
      slug: 'fashion',
    });

    await expect(
      BusinessCategoryService.createCategory({ ...baseCategoryData, name: 'Different Name' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── updateCategory ────────────────────────────────────────────────────────

describe('BusinessCategoryService.updateCategory', () => {
  it('partially updates a category and returns the updated record', async () => {
    const updated = { ...savedCategory, name: 'High Fashion', display_order: 2 };
    mockPrisma.businessCategory.findUnique.mockResolvedValue(savedCategory); // exists check
    mockPrisma.businessCategory.findFirst.mockResolvedValue(null);           // no conflict
    mockPrisma.businessCategory.update.mockResolvedValue(updated);

    const result = await BusinessCategoryService.updateCategory('cat-1', {
      name: 'High Fashion',
      display_order: 2,
    });

    expect(mockPrisma.businessCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { name: 'High Fashion', display_order: 2 },
    });
    expect(result.name).toBe('High Fashion');
  });

  it('throws 404 when category does not exist', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(null);

    await expect(
      BusinessCategoryService.updateCategory('missing-id', { name: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockPrisma.businessCategory.update).not.toHaveBeenCalled();
  });

  it('throws 409 when the new name conflicts with another category', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(savedCategory);
    mockPrisma.businessCategory.findFirst.mockResolvedValue({ id: 'cat-2', name: 'Electronics' });

    await expect(
      BusinessCategoryService.updateCategory('cat-1', { name: 'Electronics' })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockPrisma.businessCategory.update).not.toHaveBeenCalled();
  });
});

// ─── deleteCategory ────────────────────────────────────────────────────────

describe('BusinessCategoryService.deleteCategory', () => {
  it('soft-deletes by setting is_active to false (no hard delete)', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(savedCategory);
    mockPrisma.businessCategory.update.mockResolvedValue({ ...savedCategory, is_active: false });

    await BusinessCategoryService.deleteCategory('cat-1');

    expect(mockPrisma.businessCategory.update).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
      data: { is_active: false },
    });
  });

  it('throws 404 when category does not exist', async () => {
    mockPrisma.businessCategory.findUnique.mockResolvedValue(null);

    await expect(BusinessCategoryService.deleteCategory('missing-id')).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(mockPrisma.businessCategory.update).not.toHaveBeenCalled();
  });
});
