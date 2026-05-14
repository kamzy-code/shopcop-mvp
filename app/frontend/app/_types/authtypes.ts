import { UserRole } from ".";

export interface SignupParams {
  role: UserRole;
  email: string;
}


export interface SignupResponse {
  message: string;
  email: string;
}

export interface VerifyOTPParams {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    email_verified: boolean;
  };
}

export interface MagicLinkLoginParams {
  email: string;
}

export interface MagicLinkLoginResponse {
  message: string;
  email: string;
}

export interface VerifymagicLinkParams {
  token: string;
}

export interface VerifymagicLinkResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    email_verified: boolean;
  };
}

export interface ResendOTPParams {
  email: string;
}

export interface ResendOTPResponse {
  message: string;
  email: string;
}
