import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/authTypes.js';
import { prisma } from '@config/prisma.js';
import { authLogger } from '@utils/logger.js';
import { env } from '@config/env.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
export const generateJWT = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
};

// Check rate limit
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
