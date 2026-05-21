export type UserRole = 'ADMIN' | 'VENDOR' | 'BUYER';
export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK';
export type Gender = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
export type VendorTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
export type PaymentModel = 'FULL_PAYMENT' | 'PART_PAYMENT' | 'PAY_ON_DELIVERY' | 'INSTALLMENT';
export type RefundPolicyType =
  | 'NO_REFUNDS'
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'EXCHANGE_ONLY'
  | 'STORE_CREDIT'
  | 'CASE_BY_CASE';
export type PrimaryContactMethod = 'WHATSAPP' | 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'PHONE_CALL';

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
  user_id: string;

  // Personal info
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  phone_number: string | null;

  // Business info
  business_name: string | null;
  business_description: string | null;
  slug: string | null;
  profile_photo_url: string | null;

  // Location
  country: string;
  state: string | null;
  city: string | null;
  street_address: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;

  // Categorization
  primary_category: string | null;
  subcategories: string[];

  // Payment
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  payment_models: PaymentModel[];

  // Refund policy
  refund_policy_type: RefundPolicyType;
  refund_duration_days: number | null;
  refund_conditions: string[];
  refund_custom_notes: string | null;

  // Social media
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_url: string | null;
  whatsapp_number: string | null;
  primary_contact: PrimaryContactMethod | null;

  // Tier & completeness
  current_tier: VendorTier;
  verification_points: number;
  personal_info_complete: boolean;
  business_info_complete: boolean;
  profile_completeness: number;

  // Metrics
  total_transactions: number;
  fulfillment_rate: number;
  average_rating: number;

  // Status & timestamps
  profile_status: string;
  created_at: string;
  updated_at: string;
  last_transaction_at: string | null;

  // Included relations
  verifications: VerificationRecord[];
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
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

export type VerificationType = 'NIN' | 'CAC' | 'SMEDAN' | 'ADDRESS';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VerificationRecord {
  id: string;
  vendor_id: string;
  type: VerificationType;
  status: VerificationStatus;
  points_value: number;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
}

export interface ProfileCompletenessSection {
  completed: boolean;
  weight: number;
  percentage: number;
}

export interface ProfileCompletenessBreakdown {
  total_completeness: number;
  sections: {
    personal_info: ProfileCompletenessSection;
    business_info: ProfileCompletenessSection;
    nin_verification: ProfileCompletenessSection;
    address_verification: ProfileCompletenessSection;
    business_verification: ProfileCompletenessSection;
  };
}
