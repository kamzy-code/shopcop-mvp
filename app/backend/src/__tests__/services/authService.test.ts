import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), upsert: vi.fn(), update: vi.fn(), delete: vi.fn() },
    otpCode: { deleteMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    rateLimit: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    magicLink: { findUnique: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@utils/emailTemplates.js', () => ({
  sendOTPEmail: vi.fn(),
  sendMagicLinkEmail: vi.fn(),
}));

vi.mock('helpers/authHelper.js', () => ({
  generateOTP: vi.fn(() => '123456'),
  generateJWT: vi.fn(() => 'mock-jwt-token'),
  checkRateLimit: vi.fn(() => true),
}));

import { AuthService } from '@services/authService.js';
import { prisma } from '@config/prisma.js';
import { sendOTPEmail, sendMagicLinkEmail } from '@utils/emailTemplates.js';
import { checkRateLimit,} from 'helpers/authHelper.js';

const mockPrisma = prisma as any;
const mockSendOTPEmail = sendOTPEmail as any;
const mockSendMagicLinkEmail = sendMagicLinkEmail as any;
const mockCheckRateLimit = checkRateLimit as any;

beforeEach(() => {
  vi.resetAllMocks();
});

// ============================================
// signupWithEmail
// ============================================

describe('AuthService.signupWithEmail', () => {
  it('creates user, sends OTP, and returns message + email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockCheckRateLimit.mockResolvedValue(true);
    mockPrisma.user.upsert.mockResolvedValue({ id: 'user-1', email: 'ada@test.com', role: 'BUYER' });
    mockPrisma.otpCode.deleteMany.mockResolvedValue({});
    mockPrisma.otpCode.create.mockResolvedValue({});
    mockSendOTPEmail.mockResolvedValue(true);

    const result = await AuthService.signupWithEmail({ email: 'ada@test.com', role: 'BUYER' as any });

    expect(result.email).toBe('ada@test.com');
    expect(result.message).toContain('OTP');
    expect(mockSendOTPEmail).toHaveBeenCalledOnce();
  });

  it('throws 400 when email is already registered and verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'ada@test.com', email_verified: true });

    await expect(
      AuthService.signupWithEmail({ email: 'ada@test.com', role: 'BUYER' as any })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 429 when rate limit is exceeded', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockCheckRateLimit.mockResolvedValue(false);

    await expect(
      AuthService.signupWithEmail({ email: 'ada@test.com', role: 'BUYER' as any })
    ).rejects.toMatchObject({ statusCode: 429 });
  });

  it('rolls back user and OTP then throws 500 when email delivery fails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockCheckRateLimit.mockResolvedValue(true);
    mockPrisma.user.upsert.mockResolvedValue({ id: 'user-1', email: 'ada@test.com', role: 'BUYER' });
    mockPrisma.otpCode.deleteMany.mockResolvedValue({});
    mockPrisma.otpCode.create.mockResolvedValue({});
    mockSendOTPEmail.mockResolvedValue(false);
    mockPrisma.$transaction.mockResolvedValue([]);

    await expect(
      AuthService.signupWithEmail({ email: 'ada@test.com', role: 'BUYER' as any })
    ).rejects.toMatchObject({ statusCode: 500 });
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });
});

// ============================================
// verifyOTP
// ============================================

describe('AuthService.verifyOTP', () => {
  const mockUser = { id: 'user-1', email: 'ada@test.com', email_verified: false, role: 'BUYER' };
  const mockOtpRecord = {
    id: 'otp-1',
    code: '123456',
    attempts: 0,
    expires_at: new Date(Date.now() + 300000),
  };

  it('verifies OTP and returns token + user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.otpCode.findFirst.mockResolvedValue(mockOtpRecord);
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser, email_verified: true });

    const result = await AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '123456' });

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('ada@test.com');
  });

  it('throws 404 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '123456' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when email is already verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email_verified: true });

    await expect(
      AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '123456' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when no valid OTP record exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.otpCode.findFirst.mockResolvedValue(null);

    await expect(
      AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '123456' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when attempts have reached 5', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.otpCode.findFirst.mockResolvedValue({ ...mockOtpRecord, attempts: 5 });

    await expect(
      AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '999999' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 and increments attempts when OTP code is wrong', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.otpCode.findFirst.mockResolvedValue(mockOtpRecord);
    mockPrisma.otpCode.update.mockResolvedValue({});

    await expect(
      AuthService.verifyOTP({ email: 'ada@test.com', otp_code: '999999' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockPrisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: 'otp-1' },
      data: { attempts: { increment: 1 } },
    });
  });
});

// ============================================
// sendMagicLink
// ============================================

describe('AuthService.sendMagicLink', () => {
  const mockUser = { id: 'user-1', email: 'ada@test.com', email_verified: true };

  it('sends a magic link and returns message + email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockCheckRateLimit.mockResolvedValue(true);
    mockPrisma.magicLink.deleteMany.mockResolvedValue({});
    mockPrisma.magicLink.create.mockResolvedValue({});
    mockSendMagicLinkEmail.mockResolvedValue(true);

    const result = await AuthService.sendMagicLink({ email: 'ada@test.com' });
    expect(result.email).toBe('ada@test.com');
    expect(mockSendMagicLinkEmail).toHaveBeenCalledOnce();
  });

  it('throws 404 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(AuthService.sendMagicLink({ email: 'noone@test.com' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 400 when user email is not verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email_verified: false });

    await expect(AuthService.sendMagicLink({ email: 'ada@test.com' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 429 when rate limit is exceeded', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockCheckRateLimit.mockResolvedValue(false);

    await expect(AuthService.sendMagicLink({ email: 'ada@test.com' })).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('throws 500 when email delivery fails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockCheckRateLimit.mockResolvedValue(true);
    mockPrisma.magicLink.deleteMany.mockResolvedValue({});
    mockPrisma.magicLink.create.mockResolvedValue({});
    mockSendMagicLinkEmail.mockResolvedValue(false);

    await expect(AuthService.sendMagicLink({ email: 'ada@test.com' })).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

// ============================================
// verifyMagicLink
// ============================================

describe('AuthService.verifyMagicLink', () => {
  const mockMagicLink = {
    id: 'ml-1',
    token: 'valid-token',
    user_id: 'user-1',
    used_at: null,
    expires_at: new Date(Date.now() + 900000),
    user: { id: 'user-1', email: 'ada@test.com', name: null, avatar_url: null, role: 'BUYER', email_verified: true, is_active: true, created_at: new Date(), last_login_at: null },
  };

  it('returns token and user on valid magic link', async () => {
    mockPrisma.magicLink.findUnique.mockResolvedValue(mockMagicLink);
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await AuthService.verifyMagicLink({ token: 'valid-token' });
    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.email).toBe('ada@test.com');
  });

  it('throws 400 when token is not found', async () => {
    mockPrisma.magicLink.findUnique.mockResolvedValue(null);

    await expect(AuthService.verifyMagicLink({ token: 'bad-token' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 when token has already been used', async () => {
    mockPrisma.magicLink.findUnique.mockResolvedValue({ ...mockMagicLink, used_at: new Date() });

    await expect(AuthService.verifyMagicLink({ token: 'used-token' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 400 when token has expired', async () => {
    mockPrisma.magicLink.findUnique.mockResolvedValue({
      ...mockMagicLink,
      expires_at: new Date(Date.now() - 1000),
    });

    await expect(AuthService.verifyMagicLink({ token: 'expired-token' })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ============================================
// resendOTP
// ============================================

describe('AuthService.resendOTP', () => {
  const mockUser = { id: 'user-1', email: 'ada@test.com', email_verified: false };

  it('resends OTP and returns message + email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockCheckRateLimit.mockResolvedValue(true);
    mockPrisma.otpCode.deleteMany.mockResolvedValue({});
    mockPrisma.otpCode.create.mockResolvedValue({});
    mockSendOTPEmail.mockResolvedValue(true);

    const result = await AuthService.resendOTP('ada@test.com');
    expect(result.email).toBe('ada@test.com');
  });

  it('throws 404 when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(AuthService.resendOTP('noone@test.com')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 400 when email is already verified', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, email_verified: true });

    await expect(AuthService.resendOTP('ada@test.com')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('throws 429 when rate limit is exceeded', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockCheckRateLimit.mockResolvedValue(false);

    await expect(AuthService.resendOTP('ada@test.com')).rejects.toMatchObject({
      statusCode: 429,
    });
  });
});
