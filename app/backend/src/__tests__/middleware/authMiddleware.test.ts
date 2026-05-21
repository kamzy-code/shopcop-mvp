import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

import { authenticate } from '@middleware/authMiddleware.js';
import { prisma } from '@config/prisma.js';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const mockPrisma = prisma as any;

function mockNext(): NextFunction {
  return vi.fn();
}

function buildReq(cookieToken?: string): Request {
  return {
    cookies: cookieToken ? { auth_token: cookieToken } : {},
    user: undefined,
  } as unknown as Request;
}

const res = {} as Response;

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object, secret = JWT_SECRET, expiresIn = '1h') {
  return jwt.sign(payload, secret, { expiresIn } as any);
}

const activeUser = {
  id: 'user-1',
  email: 'ada@test.com',
  role: 'VENDOR',
  is_active: true,
  email_verified: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticate middleware', () => {
  it('attaches user to req and calls next() for a valid token', async () => {
    const token = makeToken({ userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' });
    const req = buildReq(token);
    const next = mockNext();
    mockPrisma.user.findUnique.mockResolvedValue(activeUser);

    await authenticate(req, res, next);

    expect(req.user).toMatchObject({ userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' });
    expect(next).toHaveBeenCalledWith(); // no error
  });

  it('calls next(error) with 401 when no cookie is present', async () => {
    const req = buildReq(); // no cookie
    const next = mockNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next(error) with 401 for an expired token', async () => {
    const token = makeToken(
      { userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' },
      JWT_SECRET,
      '-1s'
    );
    const req = buildReq(token);
    const next = mockNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next(error) with 401 for a token signed with wrong secret', async () => {
    const token = makeToken(
      { userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' },
      'wrong-secret'
    );
    const req = buildReq(token);
    const next = mockNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next(error) with 401 when user does not exist in DB', async () => {
    const token = makeToken({ userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' });
    const req = buildReq(token);
    const next = mockNext();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next(error) with 403 when account is deactivated', async () => {
    const token = makeToken({ userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' });
    const req = buildReq(token);
    const next = mockNext();
    mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, is_active: false });

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next(error) with 403 when email is not verified', async () => {
    const token = makeToken({ userId: 'user-1', email: 'ada@test.com', role: 'VENDOR' });
    const req = buildReq(token);
    const next = mockNext();
    mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, email_verified: false });

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
