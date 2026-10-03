import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { WaitlistStatus, WaitlistUserType } from '../../generated/prisma/client.js';

// ============================================
// TYPES
// ============================================

interface ListWaitlistFilters {
  status?: WaitlistStatus;
  user_type?: WaitlistUserType;
  open_to_chat?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// ADMIN WAITLIST SERVICE
// ============================================

export class AdminWaitlistService {
  /**
   * Get all waitlist entries with optional filtering and pagination.
   * Results are paginated with a default of 20 per page (max 100).
   */
  static async listWaitlistEntries(filters: ListWaitlistFilters = {}) {
    const { status, user_type, open_to_chat, search, page = 1, limit = 20 } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const where: any = {};

    if (status) where.status = status;
    if (user_type) where.user_type = user_type;
    if (typeof open_to_chat === 'boolean') where.open_to_chat = open_to_chat;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { trade_details: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: [{ created_at: 'desc' }],
        skip,
        take,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    adminLogger.info('Fetched waitlist entries', {
      action: 'listWaitlistEntries',
      filters,
      count: entries.length,
      total,
      page,
      limit,
    });

    return {
      entries,
      pagination: {
        page,
        limit: take,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get a single waitlist entry by ID.
   */
  static async getWaitlistEntry(id: string) {
    const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      adminLogger.warn('Waitlist entry not found', { action: 'getWaitlistEntry', id });
      throw new AppError('Waitlist entry not found', 404);
    }
    return entry;
  }

  /**
   * Update a waitlist entry's follow-up status. When moving to CONTACTED,
   * automatically stamps contacted_at and contacted_by (if provided).
   */
  static async updateWaitlistStatus(id: string, adminId: string, data: { status: WaitlistStatus; notes?: string }) {
    const existing = await prisma.waitlistEntry.findUnique({ where: { id } });
    if (!existing) {
      adminLogger.warn('Waitlist entry not found for status update', {
        action: 'updateWaitlistStatus',
        id,
        adminId,
      });
      throw new AppError('Waitlist entry not found', 404);
    }

    const updateData: any = {
      status: data.status,
      notes: data.notes ?? null,
    };

    if (data.status === 'CONTACTED' && existing.status !== 'CONTACTED') {
      updateData.contacted_at = new Date();
      updateData.contacted_by = adminId;
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: updateData,
    });

    adminLogger.info('Waitlist status updated by admin', {
      action: 'updateWaitlistStatus',
      id,
      adminId,
      fromStatus: existing.status,
      toStatus: updated.status,
    });

    return updated;
  }
}