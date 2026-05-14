import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWraper';
import {
  SignupParams,
  VerifyOTPParams,
  MagicLinkLoginParams,
  VerifymagicLinkParams,
  ResendOTPParams,
} from '../_types/authtypes';
import {
  signupSchema,
  verifyOTPSchema,
  magicLinkLoginSchema,
  verifyMagicLinkSchema,
  resendOTPSchema,
} from '../validators/authSchema';

export const useSignUp = () => {
  return useMutation({
    mutationFn: (params: SignupParams) => {
      const result = signupSchema.safeParse(params);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
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
      const result = verifyOTPSchema.safeParse(params);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
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
      const result = magicLinkLoginSchema.safeParse(params);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
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
      const result = verifyMagicLinkSchema.safeParse(params);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
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
      const result = resendOTPSchema.safeParse(params);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
      return apiFetch('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
};
