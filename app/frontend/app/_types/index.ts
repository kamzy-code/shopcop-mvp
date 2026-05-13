export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'ADMIN' | 'VENDOR' | 'BUYER';
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
