import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { ListAdminProductsQuery, AdminUpdateProductInput } from '@validators/adminProductValidator.js';
import { Prisma } from '../../generated/prisma/client.js';

const PRODUCT_INCLUDE = {
  media: { orderBy: { position: 'asc' as const } },
  vendor: { select: { id: true, business_name: true, current_tier: true } },
} as const;

export class AdminProductService {
  /**
   * List products across all vendors with admin filters: vendor, derived status
   * (active/archived/out_of_stock), flagged, low stock, and search.
   * Flagging never affects this query's notion of "active" — a flagged product
   * remains ACTIVE/visible until it is explicitly archived.
   */
  static async listProducts(filters: ListAdminProductsQuery, adminId: string) {
    const { vendor_id, status, flagged, low_stock, search, sort, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (vendor_id) where.vendor_id = vendor_id;
    if (flagged !== undefined) where.is_flagged = flagged;

    if (status === 'ARCHIVED') {
      where.deleted_at = { not: null };
    } else if (status === 'ACTIVE') {
      where.deleted_at = null;
    } else if (status === 'OUT_OF_STOCK') {
      where.deleted_at = null;
      where.stock_status = 'OUT_OF_STOCK';
    } else {
      // Default: hide archived unless explicitly requested
      where.deleted_at = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { vendor: { business_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Cross-column comparison (stock_quantity <= low_stock_threshold) isn't expressible
    // in a plain Prisma `where`, so resolve the matching IDs via raw SQL first and
    // intersect them with the rest of the filters via `id: { in: ... }`. This keeps
    // pagination (count/skip/take) correct, unlike filtering the page in-memory.
    if (low_stock) {
      const lowStockRows = await prisma.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM products WHERE track_inventory = true AND low_stock_threshold IS NOT NULL AND stock_quantity <= low_stock_threshold`
      );
      where.id = { in: lowStockRows.map((r) => r.id) };
    }

    const orderBy = (() => {
      switch (sort) {
        case 'oldest':
          return { created_at: 'asc' as const };
        case 'price_asc':
          return { price: 'asc' as const };
        case 'price_desc':
          return { price: 'desc' as const };
        default:
          return { created_at: 'desc' as const };
      }
    })();

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: PRODUCT_INCLUDE,
      }),
    ]);

    adminLogger.info('Admin fetched product list', {
      action: 'listProducts',
      adminId,
      total,
      vendor_id,
      status,
      flagged,
    });

    return { data, total, totalPages: Math.ceil(total / limit), page, limit };
  }

  /**
   * Platform-wide product analytics: quick stats by lifecycle bucket and the
   * top-performing products by units sold / revenue.
   */
  static async getAnalytics(adminId: string) {
    const [active, archived, outOfStock, flagged, topItems] = await Promise.all([
      prisma.product.count({ where: { deleted_at: null, stock_status: 'IN_STOCK' } }),
      prisma.product.count({ where: { deleted_at: { not: null } } }),
      prisma.product.count({ where: { deleted_at: null, stock_status: 'OUT_OF_STOCK' } }),
      prisma.product.count({ where: { is_flagged: true, deleted_at: null } }),
      prisma.orderItem.groupBy({
        by: ['product_id'],
        where: { product_id: { not: null }, product: { deleted_at: null } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const productIds = topItems.map((row) => row.product_id).filter((id): id is string => !!id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, vendor: { select: { business_name: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const topPerformers = topItems
      .filter((row) => row.product_id && productMap.has(row.product_id))
      .map((row) => {
        const product = productMap.get(row.product_id as string)!;
        return {
          product_id: product.id,
          name: product.name,
          vendor_name: product.vendor.business_name,
          price: product.price,
          units_sold: row._sum.quantity ?? 0,
          revenue: row._sum.subtotal ?? 0,
        };
      });

    adminLogger.info('Admin fetched product analytics', { action: 'getProductAnalytics', adminId });

    return {
      quick_stats: { active, archived, out_of_stock: outOfStock, flagged },
      top_performers: topPerformers,
    };
  }

  /** Get a single product's detail including vendor info and recent order items. */
  static async getProductById(productId: string, adminId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        ...PRODUCT_INCLUDE,
        order_items: {
          take: 10,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            quantity: true,
            item_price: true,
            subtotal: true,
            order: { select: { reference: true, created_at: true, status: true } },
          },
        },
      },
    });

    if (!product) {
      adminLogger.warn('Product not found', { action: 'getProductById', adminId, productId });
      throw new AppError('Product not found', 404);
    }

    const salesAgg = await prisma.orderItem.aggregate({
      where: { product_id: productId },
      _sum: { quantity: true, subtotal: true },
    });

    adminLogger.info('Admin fetched product detail', { action: 'getProductById', adminId, productId });

    return {
      ...product,
      analytics: {
        units_sold: salesAgg._sum.quantity ?? 0,
        revenue: salesAgg._sum.subtotal ?? 0,
      },
    };
  }

  /** Admin full-override edit of any vendor's product. Logs before/after snapshot. */
  static async updateProduct(productId: string, data: AdminUpdateProductInput, adminId: string) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      adminLogger.warn('Product not found for update', { action: 'updateProduct', adminId, productId });
      throw new AppError('Product not found', 404);
    }
    if (existing.deleted_at) {
      throw new AppError('Cannot modify an archived product', 400);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.stock_status !== undefined && { stock_status: data.stock_status }),
        ...(data.stock_quantity !== undefined && { stock_quantity: data.stock_quantity }),
      },
      include: PRODUCT_INCLUDE,
    });

    await this.logAdminAction(adminId, 'product_edited', productId, {
      before: { name: existing.name, price: existing.price, category: existing.category, stock_status: existing.stock_status },
      after: { name: updated.name, price: updated.price, category: updated.category, stock_status: updated.stock_status },
    });

    adminLogger.info('Admin updated product', { action: 'updateProduct', adminId, productId });
    return updated;
  }

  /**
   * Flag a product for quality review. Non-blocking by design: the product
   * stays ACTIVE/visible (stock_status untouched) — this only adds it to the
   * admin review queue with a reason.
   */
  static async flagProduct(productId: string, reason: string, adminId: string) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    if (existing.deleted_at) {
      throw new AppError('Cannot modify an archived product', 400);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        is_flagged: true,
        flagged_by: adminId,
        flagged_at: new Date(),
        flag_reason: reason,
      },
      include: PRODUCT_INCLUDE,
    });

    await this.logAdminAction(adminId, 'product_flagged', productId, { reason });
    adminLogger.info('Admin flagged product', { action: 'flagProduct', adminId, productId });
    return updated;
  }

  /** Clear a product's flag after admin review resolves the concern. */
  static async approveProduct(productId: string, adminId: string) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    if (existing.deleted_at) {
      throw new AppError('Cannot modify an archived product', 400);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        is_flagged: false,
        flagged_by: null,
        flagged_at: null,
        flag_reason: null,
      },
      include: PRODUCT_INCLUDE,
    });

    await this.logAdminAction(adminId, 'product_approved', productId, {
      previous_flag_reason: existing.flag_reason,
    });
    adminLogger.info('Admin approved/unflagged product', { action: 'approveProduct', adminId, productId });
    return updated;
  }

  /** Admin archive (soft delete) — the only action that removes a product from visibility. */
  static async archiveProduct(productId: string, adminId: string) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    if (existing.deleted_at) {
      throw new AppError('Product is already archived', 400);
    }

    const archived = await prisma.product.update({
      where: { id: productId },
      data: {
        deleted_at: new Date(),
        // Clear any stale flag so a future restore doesn't resurrect it.
        is_flagged: false,
        flagged_by: null,
        flagged_at: null,
        flag_reason: null,
      },
    });

    await this.logAdminAction(adminId, 'product_archived', productId, {
      product_name: existing.name,
      vendor_id: existing.vendor_id,
    });
    adminLogger.info('Admin archived product', { action: 'archiveProduct', adminId, productId });
    return archived;
  }

  private static async logAdminAction(
    adminId: string,
    actionType: string,
    targetId: string,
    metadata: Record<string, any>
  ) {
    try {
      await prisma.adminActivityLog.create({
        data: {
          admin_id: adminId,
          action_type: actionType,
          target_type: 'product',
          target_id: targetId,
          after_data: metadata,
        },
      });
    } catch (error) {
      adminLogger.error('Failed to log admin action', {
        action: 'logAdminAction',
        adminId,
        actionType,
        targetId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
