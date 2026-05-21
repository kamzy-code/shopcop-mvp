import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/authTypes.js';
import { prisma } from '@config/prisma.js';
import { authLogger } from '@utils/logger.js';
import { env } from '@config/env.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generates a cryptographically random 6-digit OTP string.
 *
 * @returns A zero-padded 6-digit numeric string (e.g. "047823")
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Signs a JWT access token with the application secret.
 *
 * @param payload - Data to embed: userId, email, and role
 * @returns Signed JWT string, expiring per `JWT_EXPIRES_IN` env var (default 30d)
 */
export const generateJWT = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
};

/**
 * Checks and enforces a sliding-window rate limit stored in the database.
 * Creates a new record on the first request within a window, increments the
 * counter on subsequent requests, and returns `false` once the limit is reached.
 *
 * @param key - Identifier for the rate-limited entity (e.g. user email)
 * @param action - Distinguishes multiple limits per key (e.g. "otp_send")
 * @param limit - Maximum number of allowed requests within the window
 * @param windowMinutes - Duration of the rate-limit window in minutes
 * @returns `true` if the request is allowed, `false` if the limit is exceeded
 */
export const checkRateLimit = async (
  key: string,
  action: string,
  limit: number,
  windowMinutes: number
): Promise<boolean> => {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMinutes * 60000);

  const rateLimit = await prisma.rateLimit.findFirst({
    where: {
      key,
      action,
      reset_at: { gte: now },
    },
  });

  if (!rateLimit) {
    // Create new rate limit record
    await prisma.rateLimit.create({
      data: {
        key,
        action,
        count: 1,
        reset_at: resetAt,
      },
    });
    return true;
  }

  if (rateLimit.count >= limit) {
    authLogger.warn(`Rate limit exceeded: ${key} - ${action}`);
    return false;
  }

  // Increment count
  await prisma.rateLimit.update({
    where: { id: rateLimit.id },
    data: { count: { increment: 1 } },
  });

  return true;
};


