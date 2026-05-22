import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from '../generated/prisma/enums.js';
import logger from '@utils/logger.js';

/**
 * Role-Based Access Control middleware factory.
 * Returns a middleware that allows only users whose role is in `allowedRoles`.
 * Must be used after `authenticate` so that `req.user` is populated.
 *
 * @param allowedRoles - One or more UserRole values that are permitted access
 * @returns Express middleware that calls next() on success
 * @throws {AppError} 401 — `req.user` is not set (authentication not run upstream)
 * @throws {AppError} 403 — User's role is not in allowedRoles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn(`Forbidden: Authentication required`, {
        service: 'RBAC Middleware',
        action: 'ROLE_CHECK_FAILED',
        timestamp: new Date().toISOString(),
      });
      throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Forbidden: User role ${req.user?.role} not allowed`, {
        service: 'RBAC Middleware',
        action: 'ROLE_CHECK_FAILED',
        userId: req.user?.userId,
        role: req.user?.role,
        timestamp: new Date().toISOString(),
      });
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware that requires the authenticated user to have the ADMIN role.
 * Must be used after the `authenticate` middleware.
 *
 * @throws {AppError} 401 — No authenticated user
 * @throws {AppError} 403 — User is not an admin
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware that requires the authenticated user to have the VENDOR role.
 * Must be used after the `authenticate` middleware.
 *
 * @throws {AppError} 401 — No authenticated user
 * @throws {AppError} 403 — User is not a vendor
 */
export const requireVendor = requireRole(UserRole.VENDOR);

/**
 * Middleware that requires the authenticated user to have either ADMIN or VENDOR role.
 * Must be used after the `authenticate` middleware.
 *
 * @throws {AppError} 401 — No authenticated user
 * @throws {AppError} 403 — User is neither admin nor vendor
 */
export const requireAdminOrVendor = requireRole(UserRole.ADMIN, UserRole.VENDOR);

/**
 * Middleware factory that checks if the authenticated user is accessing their own resource.
 * Admins are allowed to access any resource regardless of ownership.
 * The target user ID is read from `req.params.userId` (default) or `req.body.userId`.
 *
 * @param userIdField - Source of the target user ID: 'params' or 'body' (default: 'params')
 * @returns Express middleware that calls next() on success
 * @throws {AppError} 401 — No authenticated user
 * @throws {AppError} 403 — User does not own the resource and is not an admin
 */
export const requireOwnership = (userIdField: 'params' | 'body' = 'params') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const targetUserId = userIdField === 'params' ? req.params.userId : req.body.userId;

    // Admins can access any resource
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // Check if user is accessing their own resource
    if (req.user.userId !== targetUserId) {
      logger.warn(
        `Ownership check failed: User ${req.user.userId} attempted to access resource of user ${targetUserId}`
      );

      throw new AppError('You can only access your own resources.', 403);
    }

    next();
    return;
  };
};
