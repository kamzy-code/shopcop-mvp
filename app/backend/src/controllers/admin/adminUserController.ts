import { NextFunction, Request, Response } from 'express';
import { AdminUserService } from '@services/admin/adminUserService.js';
import { adminLogger } from '@utils/logger.js';
import { AppError } from '@middleware/errorHandler.js';
import { parseZodErrors } from '@utils/parseZodErros.js';
import {
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from '../../validators/adminUserValidator.js';
import { UserRole } from '../../generated/prisma/client.js';

export class AdminUserController {
  /**
   * GET /api/v1/admin/users
   * List all users with optional filters, search, and pagination.
   * Restricted to ADMIN role.
   *
   * @param req.query.role - Filter by role (VENDOR, BUYER, ADMIN)
   * @param req.query.is_active - Filter by active status ('true' | 'false')
   * @param req.query.search - Search by email or name
   * @param req.query.page - Page number (default: 1)
   * @param req.query.limit - Results per page (default: 20, max: 100)
   * @returns 200 `{ success, data: users[], pagination }`
   */
  static async listUsers(req: Request, res: Response, next: NextFunction) {
    const action = 'listUsers';
    const adminId = req.user!.userId;

    const parsed = listUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      adminLogger.warn('Invalid query parameters for listUsers', {
        action,
        adminId,
        errors: parsed.error.issues,
      });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const result = await AdminUserService.getAllUsers(
        {
          ...parsed.data,
          role: parsed.data.role as UserRole | undefined,
        },
        adminId
      );

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });

      adminLogger.info('Admin fetched user list', { action, adminId, ...parsed.data });
    } catch (error) {
      adminLogger.error('Failed to list users', {
        action,
        adminId,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/users/:id
   * Get a user's full profile including vendor info if they are a vendor.
   * Restricted to ADMIN role.
   *
   * @param req.params.id - User ID
   * @returns 200 `{ success, data: user }`
   * @throws {AppError} 404 — User not found
   */
  static async getUser(req: Request, res: Response, next: NextFunction) {
    const action = 'getUser';
    const adminId = req.user!.userId;
    const { id } = req.params;

    try {
      const user = await AdminUserService.getUserWithProfile(id as string, adminId);

      res.status(200).json({
        success: true,
        data: user,
      });

      adminLogger.info('Admin fetched user detail', { action, adminId, userId: id });
    } catch (error) {
      adminLogger.error('Failed to get user detail', {
        action,
        adminId,
        userId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id/status
   * Activate or deactivate (ban) a user account.
   * Restricted to ADMIN role.
   *
   * @param req.params.id - User ID to update
   * @param req.body.is_active - true to activate, false to deactivate
   * @param req.user.userId - Admin's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: updatedUser, message }`
   * @throws {AppError} 400 — Validation failure
   * @throws {AppError} 401 — No authenticated user
   * @throws {AppError} 404 — User not found
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    const action = 'updateUserStatus';
    const { id } = req.params;

    if (!req.user) {
      adminLogger.warn('Authentication required', { action });
      throw new AppError('Authentication required', 401);
    }

    const adminId = req.user.userId;

    const parsed = updateUserStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      adminLogger.warn('Validation failed for updateUserStatus', {
        action,
        adminId,
        errors: parsed.error.issues,
      });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const updated = await AdminUserService.updateUserStatus(
        id as string,
        parsed.data.is_active,
        adminId
      );

      const statusLabel = parsed.data.is_active ? 'activated' : 'deactivated';
      res.status(200).json({
        success: true,
        data: updated,
        message: `User account ${statusLabel} successfully.`,
      });

      adminLogger.info(`User ${statusLabel}`, { action, adminId, userId: id });
    } catch (error) {
      adminLogger.error('Failed to update user status', {
        action,
        adminId,
        userId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/users/:id/role
   * Change a user's role.
   * Restricted to ADMIN role.
   *
   * @param req.params.id - User ID to update
   * @param req.body.role - New role (VENDOR, BUYER, or ADMIN)
   * @param req.user.userId - Admin's ID (auto-populated by auth middleware)
   * @returns 200 `{ success, data: updatedUser, message }`
   * @throws {AppError} 400 — Validation failure
   * @throws {AppError} 401 — No authenticated user
   * @throws {AppError} 404 — User not found
   */
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    const action = 'updateUserRole';
    const { id } = req.params;

    if (!req.user) {
      adminLogger.warn('Authentication required', { action });
      throw new AppError('Authentication required', 401);
    }

    const adminId = req.user.userId;

    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      adminLogger.warn('Validation failed for updateUserRole', {
        action,
        adminId,
        errors: parsed.error.issues,
      });
      throw new AppError(parseZodErrors(parsed.error.issues), 400);
    }

    try {
      const updated = await AdminUserService.updateUserRole(
        id as string,
        parsed.data.role as UserRole,
        adminId
      );

      res.status(200).json({
        success: true,
        data: updated,
        message: `User role updated to ${parsed.data.role} successfully.`,
      });

      adminLogger.info('User role updated', {
        action,
        adminId,
        userId: id,
        newRole: parsed.data.role,
      });
    } catch (error) {
      adminLogger.error('Failed to update user role', {
        action,
        adminId,
        userId: id,
        error: error instanceof Error ? error.message : error,
      });
      next(error);
    }
  }
}
