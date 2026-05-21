import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    rateLimit: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { generateOTP, generateJWT, checkRateLimit } from 'helpers/authHelper.js';
import { prisma } from '@config/prisma.js';
import jwt from 'jsonwebtoken';

const mockPrisma = prisma as any;

describe('generateOTP', () => {
  it('returns a 6-character string', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
  });

  it('returns a numeric string', () => {
    const otp = generateOTP();
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('generates different values on successive calls', () => {
    const results = new Set(Array.from({ length: 10 }, generateOTP));
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('generateJWT', () => {
  it('returns a non-empty string', () => {
    const token = generateJWT({ userId: 'user-1', email: 'test@test.com', role: 'VENDOR' as any });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('encodes the userId, email, and role in the payload', () => {
    const payload = { userId: 'user-abc', email: 'ada@test.com', role: 'BUYER' as any };
    const token = generateJWT(payload);
    const decoded = jwt.decode(token) as any;
    expect(decoded.userId).toBe('user-abc');
    expect(decoded.email).toBe('ada@test.com');
    expect(decoded.role).toBe('BUYER');
  });

  it('produces a verifiable JWT using the configured secret', () => {
    const token = generateJWT({ userId: 'user-1', email: 'test@test.com', role: 'ADMIN' as any });
    expect(() =>
      jwt.verify(token, process.env.JWT_SECRET!)
    ).not.toThrow();
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new record and returns true on first request', async () => {
    mockPrisma.rateLimit.findFirst.mockResolvedValue(null);
    mockPrisma.rateLimit.create.mockResolvedValue({});

    const result = await checkRateLimit('user@test.com', 'otp_send', 3, 15);
    expect(result).toBe(true);
    expect(mockPrisma.rateLimit.create).toHaveBeenCalledOnce();
  });

  it('increments the count and returns true when under the limit', async () => {
    mockPrisma.rateLimit.findFirst.mockResolvedValue({
      id: 'rl-1',
      key: 'user@test.com',
      action: 'otp_send',
      count: 1,
      reset_at: new Date(Date.now() + 900000),
    });
    mockPrisma.rateLimit.update.mockResolvedValue({});

    const result = await checkRateLimit('user@test.com', 'otp_send', 3, 15);
    expect(result).toBe(true);
    expect(mockPrisma.rateLimit.update).toHaveBeenCalledWith({
      where: { id: 'rl-1' },
      data: { count: { increment: 1 } },
    });
  });

  it('returns false when count has reached the limit', async () => {
    mockPrisma.rateLimit.findFirst.mockResolvedValue({
      id: 'rl-1',
      key: 'user@test.com',
      action: 'otp_send',
      count: 3,
      reset_at: new Date(Date.now() + 900000),
    });

    const result = await checkRateLimit('user@test.com', 'otp_send', 3, 15);
    expect(result).toBe(false);
    expect(mockPrisma.rateLimit.update).not.toHaveBeenCalled();
    expect(mockPrisma.rateLimit.create).not.toHaveBeenCalled();
  });

  it('returns false when count exceeds the limit', async () => {
    mockPrisma.rateLimit.findFirst.mockResolvedValue({
      id: 'rl-1',
      count: 10,
      reset_at: new Date(Date.now() + 900000),
    });

    const result = await checkRateLimit('user@test.com', 'otp_send', 3, 15);
    expect(result).toBe(false);
  });
});
