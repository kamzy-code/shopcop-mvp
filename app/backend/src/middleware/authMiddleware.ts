import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/prisma.js';
import { authLogger } from '@utils/logger.js';
import { JWTPayload } from '../types/authTypes.js';
import { AppError } from './errorHandler.js';
import { env } from '@config/env.js';

// ============================================
// AUTH MIDDLEWARE
// ============================================

/**
 * Enforces authentication by reading the `auth_token` httpOnly cookie.
 * Verifies the JWT, confirms the user still exists, is active, and has a verified
 * email, then attaches `{ userId, email, role }` to `req.user`.
 *
 * @param req - Express request object (reads auth_token cookie, attaches req.user on success)
 * @param res - Express response object
 * @param next - Express next function
 * @throws {AppError} 401 — Missing, invalid, or expired token
 * @throws {AppError} 401 — User no longer exists in the database
 * @throws {AppError} 403 — Account has been deactivated
 * @throws {AppError} 403 — Email address not yet verified
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    //  reads from httpOnly cookie
    const token = req.cookies?.auth_token;
    if (!token) {
      authLogger.warn('Authentication failed: No token cookie provided', {
        action: 'authenticate',
      });
      throw new AppError('Authentication required. Please log in.', 401);
    }

    // Verify JWT
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET!) as JWTPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        authLogger.warn('Authentication failed: Token expired', { action: 'authenticate' });
        throw new AppError('Token expired. Please log in again.', 401);
      }
      authLogger.warn('Authentication failed: Invalid token', {
        action: 'authenticate',
        error: error.message,
      });
      throw new AppError('Invalid token. Please log in again.', 401);
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        email_verified: true,
      },
    });

    if (!user) {
      authLogger.warn('Authentication failed: User not found', { action: 'authenticate' });
      throw new AppError('User not found. Please log in again.', 401);
    }

    if (!user.is_active) {
      authLogger.warn('Authentication failed: User account deactivated', {
        action: 'authenticate',
        userId: user.id,
      });
      throw new AppError('User account is deactivated. Please contact support.', 403);
    }

    if (!user.email_verified) {
      authLogger.warn('Authentication failed: Email not verified', {
        action: 'authenticate',
        email: user.email,
        userId: user.id,
      });
      throw new AppError('Email not verified. Please verify your email first.', 403);
    }

    // Attach user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    authLogger.info('Authentication successful', {
      action: 'authenticate',
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Continue to next middleware/controller
    next();
  } catch (error) {
    authLogger.error('Auth middleware error:', { action: 'authenticate', error });
    next(error);
  }
};

// ============================================
// OPTIONAL AUTH (allows both authenticated and unauthenticated)
// ============================================

/**
 * Attempts to authenticate from the `auth_token` cookie but does NOT block the
 * request on a valid token being absent or invalid. If a valid token is found and
 * the user is active and verified, `req.user` is populated; otherwise the request
 * continues unauthenticated.
 *
 * @param req - Express request object (reads auth_token cookie, optionally attaches req.user)
 * @param res - Express response object
 * @param next - Express next function
 * @remarks
 * Current behaviour diverges from typical optional-auth semantics: when no token
 * cookie is present at all, this middleware throws a 401 instead of continuing
 * anonymously. This is an existing behaviour, not intentional design.
 *
 * @throws {AppError} 401 — Only when the `auth_token` cookie is entirely absent
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // After: reads from httpOnly cookie
    const token = req.cookies?.auth_token;
    if (!token) {
      authLogger.warn('Authentication failed: No token cookie provided', {
        action: 'authenticate',
      });
      throw new AppError('Authentication required. Please log in.', 401);
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET!) as JWTPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true,
          email_verified: true,
        },
      });

      if (user && user.is_active && user.email_verified) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };
      }
    } catch (error) {
      // Token invalid, continue as unauthenticated
      authLogger.warn('Optional auth: Invalid token, continuing as guest', {
        action: 'optionalAuth',
        error: error instanceof Error ? error.message : error,
      });
    }

    next();
  } catch (error) {
    authLogger.error('Optional auth middleware error:', { action: 'optionalAuth', error });
    next(error);
  }
};
