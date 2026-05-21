import { describe, it, expect, vi } from 'vitest';

// env.NODE_ENV is read at module load time, so we must mock before importing errorHandler
vi.mock('@config/env.js', () => ({
  env: {
    NODE_ENV: 'development',
    JWT_SECRET: 'test-secret',
    JWT_EXPIRES_IN: '1h',
    DATABASE_URL: 'postgresql://test',
    FRONTEND_URL: 'http://localhost:3000',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    SMS_SENDER_ID: 'TEST',
    PORT: 5001,
  },
}));

import { AppError, errorHandler } from '@middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

function mockRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { path: '/test', method: 'GET', ip: '127.0.0.1', ...overrides } as Request;
}

describe('AppError', () => {
  it('sets message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
  });

  it('defaults statusCode to 500', () => {
    const err = new AppError('Something broke');
    expect(err.statusCode).toBe(500);
  });

  it('sets isOperational to true', () => {
    const err = new AppError('Operational error', 400);
    expect(err.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    expect(new AppError('x', 400)).toBeInstanceOf(Error);
  });
});

describe('errorHandler middleware', () => {
  const next: NextFunction = vi.fn();

  it('responds with AppError statusCode and message', () => {
    const err = new AppError('Forbidden', 403);
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Forbidden' })
    );
  });

  it('responds with 500 for a generic Error', () => {
    const err = new Error('Unexpected failure');
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Internal server error' })
    );
  });

  it('includes stack trace because env.NODE_ENV is development (mocked)', () => {
    const err = new AppError('Dev error', 400);
    const res = mockRes();

    errorHandler(err, mockReq(), res, next);

    const call = (res.json as any).mock.calls[0][0];
    expect(call.stack).toBeDefined();
  });
});
