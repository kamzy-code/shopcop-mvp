import { prisma } from '@config/prisma.js';
import { sendOTPEmail, sendMagicLinkEmail } from '@utils/emailTemplates.js';
import { authLogger } from '@utils/logger.js';
import {
  SendMagicLinkParams,
  SignupWithEmailParams,
  VerifyMagicLinkParams,
  VerifyOTPParams,
} from '../types/authTypes.js';
import crypto from 'crypto';
import { UserRole, AuthProvider, VendorTier } from '../generated/prisma/client.js';
import { checkRateLimit, generateOTP, generateJWT } from '../helpers/authHelper.js';
import { env } from '@config/env.js';
import { AppError } from '@middleware/errorHandler.js';

export class AuthService {
  /**
   * Initiates email signup by generating a 6-digit OTP and sending it to the user.
   * Upserts the user record if a previous unverified attempt exists.
   * Rate-limited to 3 OTP requests per 15 minutes per email address.
   * On email delivery failure, the user record and OTP are rolled back.
   *
   * @param email - Email address to register
   * @param role - Desired account role (defaults to BUYER)
   * @returns Object with a confirmation message and the registered email
   * @throws {AppError} 400 — Email already registered and verified
   * @throws {AppError} 429 — Rate limit exceeded (3 OTPs per 15 minutes)
   * @throws {AppError} 500 — Email delivery failure
   */
  static async signupWithEmail({ email, role = UserRole.BUYER }: SignupWithEmailParams) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.email_verified) {
      authLogger.warn(`Signup attempt with already registered email: ${email}`, {
        action: 'signupWithEmail',
      });
      throw new AppError('Email already registered. Please sign in instead.', 400);
    }

    const canSend = await checkRateLimit(email, 'otp_send', 3, 15);
    if (!canSend) {
      authLogger.warn(`Rate limit exceeded for OTP send: ${email}`, { action: 'signupWithEmail' });
      throw new AppError('Too many OTP requests. Please try again in 15 minutes.', 429);
    }

    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const user = await prisma.user.upsert({
      where: { email },
      update: { role: role.toUpperCase() as UserRole },
      create: {
        email,
        role: role.toUpperCase() as UserRole,
        auth_provider: AuthProvider.EMAIL,
        email_verified: false,
      },
    });

    await prisma.otpCode.deleteMany({ where: { user_id: user.id } });

    await prisma.otpCode.create({
      data: {
        user_id: user.id,
        code: otpCode,
        expires_at: otpExpiresAt,
      },
    });

    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      await prisma.$transaction([
        prisma.otpCode.deleteMany({ where: { user_id: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
      authLogger.error(`Failed to send OTP email to ${email}`, { action: 'signupWithEmail' });
      throw new AppError('Failed to send OTP email. Please try again.', 500);
    }

    authLogger.info(`OTP sent to ${email}`, { action: 'signupWithEmail' });

    return {
      message: 'OTP sent to your email. Please check your inbox.',
      email: user.email,
    };
  }

  /**
   * Verifies the OTP submitted during signup and activates the user account.
   * Enforces a 5-attempt lockout on the OTP record to prevent brute-force.
   * On first VENDOR login, an empty VendorProfile is created in the same transaction.
   * Sets the JWT as an httpOnly cookie via the calling controller.
   *
   * @param email - Email address of the user to verify
   * @param otp_code - 6-digit OTP submitted by the user
   * @returns JWT token and sanitised user object
   * @throws {AppError} 404 — No account found for the email
   * @throws {AppError} 400 — Email already verified
   * @throws {AppError} 400 — No valid (non-expired) OTP found
   * @throws {AppError} 400 — Too many failed attempts (≥5)
   * @throws {AppError} 400 — Incorrect OTP code
   */
  // VERIFY OTP: Verify OTP and create account
  static async verifyOTP({ email, otp_code }: VerifyOTPParams) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      authLogger.warn(`OTP verification attempt for non-existent email: ${email}`, {
        action: 'verifyOTP',
      });
      throw new AppError('User not found. Please sign up first.', 404);
    }

    if (user.email_verified) {
      authLogger.warn(`OTP verification attempt for already verified email: ${email}`, {
        action: 'verifyOTP',
      });
      throw new AppError('Email already verified. Please sign in instead.', 400);
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        user_id: user.id,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      authLogger.warn(`OTP verification attempt with invalid OTP: ${email}`, {
        action: 'verifyOTP',
        email,
      });
      throw new AppError('No valid OTP found. Please request a new one.', 400);
    }

    if (otpRecord.attempts >= 5) {
      authLogger.warn(`OTP verification attempt with too many failed attempts: ${email}`, {
        action: 'verifyOTP',
        email,
      });
      throw new AppError('Too many failed attempts. Please request a new OTP.', 400);
    }

    if (otpRecord.code !== otp_code) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      authLogger.warn(`OTP verification attempt with incorrect OTP: ${email}`, {
        action: 'verifyOTP',
        email,
      });
      throw new AppError('Invalid OTP. Please try again.', 400);
    }

    await prisma.$transaction([
      prisma.otpCode.deleteMany({ where: { user_id: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          last_login_at: new Date(),
          ...(user.role === UserRole.VENDOR
            ? {
                vendor_profile: {
                  create: {
                    current_tier: VendorTier.TIER_0,
                    verification_points: 0,
                    personal_info_complete: false,
                    business_info_complete: false,
                    profile_completeness: 0,
                  },
                },
              }
            : {}),
        },
        include: user.role === UserRole.VENDOR ? { vendor_profile: true } : undefined,
      }),
    ]);
    
    const verifiedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    const token = generateJWT({
      userId: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    });

    authLogger.info(`User verified and logged in: ${email}`, {
      userId: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
      action: 'verifyOTP',
    });

    return {
      token,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        avatar_url: verifiedUser.avatar_url,
        role: verifiedUser.role,
        email_verified: verifiedUser.email_verified,
        is_active: verifiedUser.is_active,
        created_at: verifiedUser.created_at,
        last_login_at: verifiedUser.last_login_at,
      },
    };
  }

  /**
   * Sends a one-time magic link to a registered, verified email address.
   * Deletes any existing unexpired magic links before creating a new one.
   * Rate-limited to 5 requests per 60 minutes per email address.
   *
   * @param email - Email address of the account to log in
   * @returns Object with a confirmation message and the email address
   * @throws {AppError} 404 — No account found for the email
   * @throws {AppError} 400 — Email not yet verified
   * @throws {AppError} 429 — Rate limit exceeded (5 requests per hour)
   * @throws {AppError} 500 — Email delivery failure
   */
  // LOGIN: Send magic link to email
  static async sendMagicLink({ email }: SendMagicLinkParams) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      authLogger.warn(`Magic link login attempt with non-existent email: ${email}`, {
        action: 'sendMagicLink',
        email,
      });
      throw new AppError('No account found with this email. Please sign up first.', 404);
    }

    if (!user.email_verified) {
      authLogger.warn(`Magic link login attempt with unverified email: ${email}`, {
        action: 'sendMagicLink',
        email,
      });
      throw new AppError('Email not verified. Please complete signup first.', 400);
    }

    const canSend = await checkRateLimit(email, 'magic_link_send', 5, 60);
    if (!canSend) {
      authLogger.warn(`Rate limit exceeded for magic link send: ${email}`, {
        action: 'sendMagicLink',
        email,
      });
      throw new AppError('Too many login attempts. Please try again in 1 hour.', 429);
    }

    const magicToken = crypto.randomUUID();
    const magicExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.magicLink.deleteMany({
      where: { user_id: user.id, expires_at: { gte: new Date() } },
    });

    await prisma.magicLink.create({
      data: {
        user_id: user.id,
        token: magicToken,
        expires_at: magicExpiresAt,
      },
    });

    const magicLink = `${env.FRONTEND_URL}/auth/verify-login?token=${magicToken}`;

    const emailSent = await sendMagicLinkEmail(email, magicLink);

    if (!emailSent) {
      authLogger.error('Failed to send magic link', {
        action: 'sendMagicLink',
        email,
      });
      throw new AppError('Failed to send magic link. Please try again.', 500);
    }

    authLogger.info(`Magic link sent to ${email}`, { email, action: 'sendMagicLink' });

    return {
      message: 'Magic link sent to your email. Please check your inbox.',
      email: user.email,
    };
  }

  /**
   * Validates a magic link token and logs the user in.
   * Marks the token as used (`used_at`) and updates `last_login_at` in a single transaction.
   *
   * @param token - UUID magic link token from the login URL
   * @returns JWT token and sanitised user object
   * @throws {AppError} 400 — Token not found or invalid
   * @throws {AppError} 400 — Token already used
   * @throws {AppError} 400 — Token has expired (15-minute TTL)
   */
  // VERIFY MAGIC LINK: Verify token and log in user
  static async verifyMagicLink({ token }: VerifyMagicLinkParams) {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      authLogger.warn('Magic link verification attempt with invalid token', {
        action: 'verifyMagicLink',
        token,
      });
      throw new AppError('Invalid or expired magic link.', 400);
    }

    if (magicLink.used_at) {
      authLogger.warn('Magic link verification attempt with already used token', {
        action: 'verifyMagicLink',
        token,
      });
      throw new AppError('Magic link has already been used.', 400);
    }

    if (new Date() > magicLink.expires_at) {
      authLogger.warn('Magic link verification attempt with expired token', {
        action: 'verifyMagicLink',
        token,
      });
      throw new AppError('Magic link expired. Please request a new one.', 400);
    }

    await prisma.$transaction([
      prisma.magicLink.update({
        where: { id: magicLink.id },
        data: { used_at: new Date() },
      }),
      prisma.user.update({
        where: { id: magicLink.user_id },
        data: { last_login_at: new Date() },
      }),
    ]);

    const jwtToken = generateJWT({
      userId: magicLink.user.id,
      email: magicLink.user.email,
      role: magicLink.user.role,
    });

    authLogger.info(`User logged in via magic link: ${magicLink.user.email}`, {
      userId: magicLink.user.id,
      email: magicLink.user.email,
      role: magicLink.user.role,
      action: 'verifyMagicLink',
    });

    return {
      token: jwtToken,
      user: {
        id: magicLink.user.id,
        email: magicLink.user.email,
        name: magicLink.user.name,
        avatar_url: magicLink.user.avatar_url,
        role: magicLink.user.role,
        email_verified: magicLink.user.email_verified,
        is_active: magicLink.user.is_active,
        created_at: magicLink.user.created_at,
        last_login_at: magicLink.user.last_login_at,
      },
    };
  }

  /**
   * Resends an OTP to an unverified email address.
   * Shares the same rate-limit bucket as `signupWithEmail` (3 per 15 minutes, key: "otp_send").
   * Replaces any existing OTP record for the user before sending.
   *
   * @param email - Email address to resend the OTP to
   * @returns Object with a confirmation message and the email address
   * @throws {AppError} 404 — No account found for the email
   * @throws {AppError} 400 — Email already verified
   * @throws {AppError} 429 — Rate limit exceeded
   * @throws {AppError} 500 — Email delivery failure
   */
  // RESEND OTP (if user didn't receive it)
  static async resendOTP(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      authLogger.warn(`OTP resend attempt for non-existent email: ${email}`, {
        action: 'resendOTP',
        email,
      });
      throw new AppError('User not found.', 404);
    }

    if (user.email_verified) {
      authLogger.warn(`OTP resend attempt for already verified email: ${email}`, {
        action: 'resendOTP',
        email,
      });
      throw new AppError('Email already verified. Please sign in instead.', 400);
    }

    const canSend = await checkRateLimit(email, 'otp_send', 3, 15);
    if (!canSend) {
      authLogger.warn(`Rate limit exceeded for OTP resend: ${email}`, {
        action: 'resendOTP',
        email,
      });
      throw new AppError('Too many OTP requests. Please try again in 15 minutes.', 429);
    }

    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpCode.deleteMany({ where: { user_id: user.id } });

    await prisma.otpCode.create({
      data: {
        user_id: user.id,
        code: otpCode,
        expires_at: otpExpiresAt,
      },
    });

    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent) {
      authLogger.error(`Failed to resend OTP email to ${email}`, { action: 'resendOTP', email });
      throw new AppError('Failed to send OTP. Please try again.', 500);
    }

    authLogger.info(`OTP resent to ${email}`, { email, action: 'resendOTP' });

    return {
      message: 'New OTP sent to your email.',
      email: user.email,
    };
  }
}
