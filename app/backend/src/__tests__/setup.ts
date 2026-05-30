import { vi } from 'vitest';

// Populate all required env vars before any module import resolves env.ts
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/shopcop_test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SMS_SENDER_ID = 'TEST';
process.env.PORT = '5001';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.CLOUDINARY_UPLOAD_PRESET = 'test-preset';

// Suppress logger output in all tests
vi.mock('@utils/logger.js', () => {
  const silent = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    default: silent,
    emailLogger: silent,
    authLogger: silent,
    userLogger: silent,
    fileUplaodLogger: silent,
    vendorLogger: silent,
    adminLogger: silent,
    categoryLogger: silent,
    transactionLogger: silent,
    productLogger: silent,
  };
});
