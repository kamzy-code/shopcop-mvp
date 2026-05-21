import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import { UserRole, User } from '../_types';

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
    mutationFn: (params: SignupParams) =>
      apiFetch<SignupResponse>('/auth/credential-signup', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};

export const useVerifyAccountViaOTP = () => {
  return useMutation({
    mutationFn: (params: VerifyOTPParams) =>
      apiFetch<VerifyOTPResponse>('/auth/verify-account', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};

/** @deprecated Use useVerifyAccountViaOTP */
export const useVerifyAccounViaOTP = useVerifyAccountViaOTP;

export const useLoginWithMagicLink = () => {
  return useMutation({
    mutationFn: (params: MagicLinkLoginParams) =>
      apiFetch<MagicLinkLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};

/** @deprecated Use useLoginWithMagicLink */
export const useLogiWithMagicLink = useLoginWithMagicLink;

export const useVerifyLoginLink = () => {
  return useMutation({
    mutationFn: (params: VerifymagicLinkParams) =>
      apiFetch<VerifymagicLinkResponse>('/auth/verify-login-link', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};

export const useResendOTP = () => {
  return useMutation({
    mutationFn: (params: ResendOTPParams) =>
      apiFetch<ResendOTPResponse>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
};

export const fetchCurrentUser = async (): Promise<User> => {
  const result = await apiFetch<User>('/users/me');
  return result.data;
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }),
  });
};
