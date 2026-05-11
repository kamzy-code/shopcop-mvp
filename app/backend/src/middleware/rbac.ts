import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from 'generated/prisma/enums.js';
import logger from '@utils/logger.js';

export interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole };
}

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
