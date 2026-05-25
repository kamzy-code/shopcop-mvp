import { prisma } from '@config/prisma.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { UserRole } from '../../generated/prisma/client.js';

// ============================================
// TYPES
// ============================================

interface ListUsersFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Shared select fields for user queries — never exposes auth tokens or sensitive data
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar_url: true,
  role: true,
  is_active: true,
  email_verified: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} as const;

// ============================================
// ADMIN USER SERVICE
// ============================================

export class AdminUserService {
  /**
   * Get all users with optional filtering by role, is_active status, and email/name search.
   * Results are paginated with a default of 20 per page (max 100).
   *
   * @param filters.role - Filter by user role (VENDOR, BUYER, ADMIN)
   * @param filters.is_active - Filter by active status
   * @param filters.search - Search by email or name (case-insensitive)
   * @param filters.page - Page number (default: 1)
   * @param filters.limit - Results per page (default: 20, max: 100)
   * @returns Object with users array and pagination info
   */
  static async getAllUsers(filters: ListUsersFilters, adminId: string) {
    const action = 'getAllUsers';
    const { role, is_active, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: USER_SELECT,
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      adminLogger.info('Admin fetched user list', {
        action,
        adminId,
        role,
        is_active,
        search,
        total,
      });

      return {
        users,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      adminLogger.error('Failed to fetch user list', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get a single user by ID including their vendor profile (if any).
   * Returns non-sensitive user fields only.
   *
   * @param userId - User record ID
   * @returns User with optional nested vendor_profile
   * @throws {AppError} 404 — User not found
   */
  static async getUserWithProfile(userId: string, adminId: string) {
    const action = 'getUserWithProfile';

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT,
        vendor_profile: {
          select: {
            id: true,
            business_name: true,
            current_tier: true,
            verification_points: true,
            profile_completeness: true,
            personal_info_complete: true,
            business_info_complete: true,
            profile_status: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      adminLogger.warn('User not found', { action, adminId, userId });
      throw new AppError('User not found', 404);
    }

    adminLogger.info('Admin fetched user with profile', { action, adminId, userId });
    return user;
  }

  /**
   * Update a user's active status (ban or unban).
   * Logs the action to the admin audit trail.
   *
   * @param userId - User record ID
   * @param is_active - true to activate, false to deactivate/ban
   * @param adminId - Admin performing the action (for audit log)
   * @returns Updated user object
   * @throws {AppError} 404 — User not found
   */
  static async updateUserStatus(userId: string, is_active: boolean, adminId: string) {
    const action = 'updateUserStatus';

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      adminLogger.warn('User not found for status update', { action, userId, adminId });
      throw new AppError('User not found', 404);
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { is_active },
        select: USER_SELECT,
      });

      await this.logAdminAction(
        adminId,
        is_active ? 'user_activated' : 'user_deactivated',
        userId,
        {
          previous_status: existing.is_active,
          new_status: is_active,
          target_email: existing.email,
        }
      );

      adminLogger.info('User status updated', {
        action,
        userId,
        adminId,
        is_active,
      });

      return updated;
    } catch (error) {
      adminLogger.error('Failed to update user status', {
        action,
        userId,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update a user's role.
   * Logs the action to the admin audit trail.
   *
   * @param userId - User record ID
   * @param role - New role to assign
   * @param adminId - Admin performing the action (for audit log)
   * @returns Updated user object
   * @throws {AppError} 404 — User not found
   */
  static async updateUserRole(userId: string, role: UserRole, adminId: string) {
    const action = 'updateUserRole';

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      adminLogger.warn('User not found for role update', { action, userId, adminId });
      throw new AppError('User not found', 404);
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: USER_SELECT,
      });

      await this.logAdminAction(adminId, 'user_role_changed', userId, {
        previous_role: existing.role,
        new_role: role,
        target_email: existing.email,
      });

      adminLogger.info('User role updated', {
        action,
        userId,
        adminId,
        previousRole: existing.role,
        newRole: role,
      });

      return updated;
    } catch (error) {
      adminLogger.error('Failed to update user role', {
        action,
        userId,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Log an admin action to the audit trail.
   * Failures are logged but not rethrown — they must not disrupt the main operation.
   *
   * @param adminId - Admin user's ID
   * @param actionType - Action type identifier
   * @param targetId - Target user's ID
   * @param metadata - Additional context for the audit log
   */
  private static async logAdminAction(
    adminId: string,
    actionType: string,
    targetId: string,
    metadata: Record<string, string | boolean | null>
  ) {
    try {
      await prisma.adminActivityLog.create({
        data: {
          admin_id: adminId,
          action_type: actionType,
          target_type: 'user',
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
