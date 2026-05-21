import { describe, it, expect, vi } from 'vitest';
import { requireRole, requireAdmin, requireVendor, requireAdminOrVendor } from '@middleware/rbac.js';
import { AppError } from '@middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

function mockNext(): NextFunction {
  return vi.fn();
}

function mockReqWithRole(role: string | null): Request {
  return {
    user: role ? { userId: 'user-1', email: 'test@test.com', role } : undefined,
  } as unknown as Request;
}

const res = {} as Response;

describe('requireRole', () => {
  it('calls next() when user has the required role', () => {
    const next = mockNext();
    const middleware = requireRole('VENDOR' as any);
    middleware(mockReqWithRole('VENDOR'), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no arguments = success
  });

  it('throws 401 when req.user is not set', () => {
    const middleware = requireRole('VENDOR' as any);
    expect(() => middleware(mockReqWithRole(null), res, mockNext())).toThrow(AppError);
    expect(() => middleware(mockReqWithRole(null), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 401 })
    );
  });

  it('throws 403 when user role is not in allowedRoles', () => {
    const middleware = requireRole('ADMIN' as any);
    expect(() => middleware(mockReqWithRole('VENDOR'), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('allows access when user has any of multiple allowed roles', () => {
    const next = mockNext();
    const middleware = requireRole('ADMIN' as any, 'VENDOR' as any);
    middleware(mockReqWithRole('VENDOR'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireAdmin', () => {
  it('allows ADMIN users', () => {
    const next = mockNext();
    requireAdmin(mockReqWithRole('ADMIN'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks VENDOR users with 403', () => {
    expect(() => requireAdmin(mockReqWithRole('VENDOR'), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('blocks BUYER users with 403', () => {
    expect(() => requireAdmin(mockReqWithRole('BUYER'), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe('requireVendor', () => {
  it('allows VENDOR users', () => {
    const next = mockNext();
    requireVendor(mockReqWithRole('VENDOR'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks ADMIN users with 403', () => {
    expect(() => requireVendor(mockReqWithRole('ADMIN'), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe('requireAdminOrVendor', () => {
  it('allows ADMIN users', () => {
    const next = mockNext();
    requireAdminOrVendor(mockReqWithRole('ADMIN'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('allows VENDOR users', () => {
    const next = mockNext();
    requireAdminOrVendor(mockReqWithRole('VENDOR'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks BUYER users with 403', () => {
    expect(() => requireAdminOrVendor(mockReqWithRole('BUYER'), res, mockNext())).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});
