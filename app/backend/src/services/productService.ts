import { prisma } from '@config/prisma.js';
import { productLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { CreateProductInput, UpdateProductInput } from '../types/productTypes.js';
import { VendorTier } from '../generated/prisma/enums.js';

const productLimitPerTier: Record<VendorTier, number | null> = {
  TIER_0: 5,
  TIER_1: 20,
  TIER_2: 100,
  TIER_3: null,
  TIER_4: null,
};

export class ProductService {
  private static async getVendorByUserId(userId: string) {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { user_id: userId },
      select: { id: true, current_tier: true, business_info_complete: true },
    });
    if (!vendor) {
      throw new AppError('Vendor profile not found', 404);
    }
    return vendor;
  }

  private static async checkTierLimit(vendorId: string, tier: VendorTier) {
    const limit = productLimitPerTier[tier];
    if (limit === null) return;

    const activeCount = await prisma.product.count({
      where: { vendor_id: vendorId, deleted_at: null },
    });

    if (activeCount >= limit) {
      throw new AppError(
        `Product limit reached. You have ${activeCount}/${limit} products. Complete verifications to upgrade your tier.`,
        403
      );
    }
  }

  static async createProduct(userId: string, data: CreateProductInput) {
    const vendor = await this.getVendorByUserId(userId);
    await this.checkTierLimit(vendor.id, vendor.current_tier);

    const product = await prisma.product.create({
      data: {
        vendor_id: vendor.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        stock_status: data.stock_status,
        stock_quantity: data.stock_quantity ?? null,
        media: data.media?.length
          ? {
              create: data.media.map((item, index) => ({
                media_url: item.url,
                public_id: item.public_id ?? null,
                media_type: item.media_type,
                is_primary: index === 0,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    productLogger.info('Product created', { vendorId: vendor.id, productId: product.id });
    return product;
  }

  static async getProducts(userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const products = await prisma.product.findMany({
      where: { vendor_id: vendor.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    return products;
  }

  static async getProductById(productId: string, userId: string) {
    const vendor = await this.getVendorByUserId(userId);

    const product = await prisma.product.findFirst({
      where: { id: productId, vendor_id: vendor.id, deleted_at: null },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  static async getPublicProductById(productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deleted_at: null },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        media: { orderBy: { position: 'asc' } },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  static async updateProduct(productId: string, userId: string, data: UpdateProductInput) {
    const existing = await this.getProductById(productId, userId);

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.stock_status !== undefined && { stock_status: data.stock_status }),
        ...(data.stock_quantity !== undefined && { stock_quantity: data.stock_quantity }),
        ...(data.media !== undefined && {
          media: {
            deleteMany: {},
            create: data.media.map((item, index) => ({
              media_url: item.url,
              public_id: item.public_id ?? null,
              media_type: item.media_type,
              is_primary: index === 0,
              position: index,
            })),
          },
        }),
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    productLogger.info('Product updated', { productId: updated.id });
    return updated;
  }

  static async deleteProduct(productId: string, userId: string) {
    const existing = await this.getProductById(productId, userId);

    const deleted = await prisma.product.update({
      where: { id: existing.id },
      data: { deleted_at: new Date() },
    });

    productLogger.info('Product soft-deleted', { productId: deleted.id });
    return deleted;
  }

  static async duplicateProduct(productId: string, userId: string) {
    const vendor = await this.getVendorByUserId(userId);
    const original = await this.getProductById(productId, userId);
    await this.checkTierLimit(vendor.id, vendor.current_tier);

    const duplicate = await prisma.product.create({
      data: {
        vendor_id: vendor.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        price: original.price,
        category: original.category,
        stock_status: original.stock_status,
        stock_quantity: original.stock_quantity,
        media: original.media.length
          ? {
              create: original.media.map((m) => ({
                media_url: m.media_url,
                public_id: m.public_id,
                media_type: m.media_type,
                is_primary: m.is_primary,
                position: m.position,
              })),
            }
          : undefined,
      },
      include: {
        media: { orderBy: { position: 'asc' } },
      },
    });

    productLogger.info('Product duplicated', {
      originalId: original.id,
      duplicateId: duplicate.id,
    });
    return duplicate;
  }
}
