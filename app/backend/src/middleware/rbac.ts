import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from 'generated/prisma/enums.js';
import logger from '@utils/logger.js';

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
 * Requires user to be an ADMIN
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Requires user to be a VENDOR
 */
export const requireVendor = requireRole(UserRole.VENDOR);

/**
 * Requires user to be either ADMIN or VENDOR
 */
export const requireAdminOrVendor = requireRole(UserRole.ADMIN, UserRole.VENDOR);

/**
 * Checks if authenticated user is accessing their own resource
 * Use when userId is in request params or body
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
