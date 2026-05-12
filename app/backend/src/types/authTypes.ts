import { UserRole } from 'generated/prisma/enums.js';
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface SignupWithEmailParams {
  email: string;
  role?: UserRole;
}

export interface VerifyOTPParams {
  email: string;
  otp_code: string;
}

export interface SendMagicLinkParams {
  email: string;
}

export interface VerifyMagicLinkParams {
  token: string;
}
