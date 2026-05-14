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
import { UserRole, AuthProvider } from '../generated/prisma/client.js';
import { checkRateLimit, generateOTP, generateJWT } from 'helpers/authHelper.js';
import { env } from '@config/env.js';
import { AppError } from '@middleware/errorHandler.js';

export class AuthService {
  // SIGNUP: Send OTP to email
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
        },
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
        role: verifiedUser.role,
        email_verified: verifiedUser.email_verified,
      },
    };
  }

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
        role: magicLink.user.role,
        email_verified: magicLink.user.email_verified,
      },
    };
  }

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
