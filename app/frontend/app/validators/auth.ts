import { z } from 'zod';

export const emailSchema = z.email('Please provide a valid email address');

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

export const tokenSchema = z
  .string()
  .nonempty('Verification token is required');

export const roleSchema = z.enum(
  ['ADMIN', 'VENDOR', 'BUYER'],
  { message: 'Role must be ADMIN, VENDOR, or BUYER' }
);

export const signupSchema = z.object({
  role: roleSchema,
  email: emailSchema,
});

export const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const magicLinkLoginSchema = z.object({
  email: emailSchema,
});

export const verifyMagicLinkSchema = z.object({
  token: tokenSchema,
});

export const resendOTPSchema = z.object({
  email: emailSchema,
});
