import { UserRole } from '../generated/prisma/enums.js';

/** Decoded JWT payload attached to req.user by the auth middleware. */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/** Parameters for initiating email signup. */
export interface SignupWithEmailParams {
  email: string;
  role?: UserRole;
}

/** Parameters for verifying a signup OTP. */
export interface VerifyOTPParams {
  email: string;
  otp_code: string;
}

/** Parameters for requesting a magic link. */
export interface SendMagicLinkParams {
  email: string;
}

/** Parameters for verifying a magic link token. */
export interface VerifyMagicLinkParams {
  token: string;
}
