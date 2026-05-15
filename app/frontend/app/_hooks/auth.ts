import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '../_lib/fetchWrapper';
import { UserRole, User } from '../_types';
import {
  signupSchema,
  verifyOTPSchema,
  magicLinkLoginSchema,
  verifyMagicLinkSchema,
  resendOTPSchema,
} from '../validators/authSchema';

function validateOrThrow<T>(schema: z.ZodType<T>, params: T): void {
  const result = schema.safeParse(params);
  if (!result.success) throw new Error(result.error.issues[0].message);
}

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
  user: User;
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
  user: User;
}

export interface ResendOTPParams {
  email: string;
}

export interface ResendOTPResponse {
  message: string;
  email: string;
}

export const useSignUp = () => {
  return useMutation({
    mutationFn: (params: SignupParams) => {
      validateOrThrow(signupSchema, params);
      return apiFetch('/auth/credential-signup', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

export const useVerifyAccounViaOTP = () => {
  return useMutation({
    mutationFn: (params: VerifyOTPParams) => {
      validateOrThrow(verifyOTPSchema, params);
      return apiFetch('/auth/verify-account', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

export const useLogiWithMagicLink = () => {
  return useMutation({
    mutationFn: (params: MagicLinkLoginParams) => {
      validateOrThrow(magicLinkLoginSchema, params);
      return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

export const useVerifyLoginLink = () => {
  return useMutation({
    mutationFn: (params: VerifymagicLinkParams) => {
      validateOrThrow(verifyMagicLinkSchema, params);
      return apiFetch('/auth/verify-login-link', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: (params: ResendOTPParams) => {
      validateOrThrow(resendOTPSchema, params);
      return apiFetch('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};

export const fetchCurrentUser = async (): Promise<User> => {
  const result = await apiFetch('/users/me');
  return result.data;
};
