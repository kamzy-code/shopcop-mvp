export type UserRole = 'ADMIN' | 'VENDOR' | 'BUYER';
export type ProfileStatus = 'INCOMPLETE' | 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: UserRole;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  categories: string[];
  address: string;
  city?: string;
  state?: string;
  description?: string;
  profilePhotoUrl?: string;
  bvnVerified: boolean;
  ninVerified: boolean;
  profileStatus: ProfileStatus;
  deliveryAreas: string[];
  paymentMethods: string[];
  refundPolicy?: string;
  slug?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stockStatus: StockStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
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
