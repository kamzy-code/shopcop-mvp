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
  total_orders: number;
  fulfillment_rate: number;
  average_rating: number;

  // Status & timestamps
  profile_status: string;
  created_at: string;
  updated_at: string;
  last_order_at: string | null;

  // Included relations
  verifications: VerificationRecord[];
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface ProductMedia {
  id: string;
  media_url: string;
  public_id: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  is_primary: boolean;
  position: number;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  stock_status: StockStatus;
  stock_quantity: number | null;
  media: ProductMedia[];
  video_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  approved_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;

  // NIN fields
  nin_number?: string;
  nin_full_name?: string;
  govt_id_front_url?: string;
  govt_id_front_public_id?: string;

  // CAC fields
  cac_rc_number?: string;
  cac_company_type?: string;
  cac_certificate_url?: string;
  cac_certificate_public_id?: string;

  // SMEDAN fields
  smedan_suin?: string;
  smedan_business_type?: string;
  smedan_certificate_url?: string;
  smedan_certificate_public_id?: string;

  // Address fields
  address_document_url?: string;
  address_document_public_id?: string;
}

// ============================================================
// ADMIN TYPES
// ============================================================

export interface AdminActivityLogEntry {
  id: string;
  admin_id: string;
  admin?: { id: string; email: string; name: string | null };
  action_type: string;
  target_type: string;
  target_id: string;
  notes: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
}

export interface AdminUserDetail extends User {
  updated_at: string;
  vendor_profile: {
    id: string;
    business_name: string | null;
    current_tier: VendorTier;
    verification_points: number;
    profile_completeness: number;
    personal_info_complete: boolean;
    business_info_complete: boolean;
    profile_status: string;
    created_at: string;
  } | null;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    by_role: Record<string, number>;
    active: number;
    inactive: number;
    new_last_7_days: number;
    new_last_30_days: number;
  };
  verifications: {
    total_pending: number;
    total_approved: number;
    total_rejected: number;
    pending_by_type: { type: string; count: number }[];
  };
  vendors: {
    tier_distribution: { tier: VendorTier; count: number }[];
    with_business_info: number;
    with_personal_info: number;
  };
  recent_activity: AdminActivityLogEntry[];
}

export interface AdminUsersResponse {
  users: AdminUserDetail[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminVerificationsResponse {
  verifications: VerificationRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  phone_number: string | null;
  department: string | null;
  role_title: string | null;
  profile_photo_url: string | null;
  profile_photo_public_id: string | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    name: string | null;
    avatar_url: string | null;
    role: UserRole;
  } | null;
}

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY_FOR_DISPATCH'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'REFUNDED'
  | 'RESOLVED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PROOF_SUBMITTED' | 'PAID' | 'REFUNDED';
export type RefundStatus = 'NONE' | 'REQUESTED' | 'IN_PROGRESS' | 'REFUNDED' | 'RESOLVED';
export type DeliveryMethod = 'PICKUP' | 'DISPATCH' | 'WAYBILL';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
  item_image_url: string | null;
  description: string | null;
  stock_deducted: number;
  stock_restored: number;
}

export interface OrderVendor {
  id: string;
  business_name: string | null;
  profile_photo_url: string | null;
  current_tier: VendorTier;
  whatsapp_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  refund_policy_type: RefundPolicyType;
  refund_duration_days: number | null;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  reference: string;
  tracking_token: string;

  vendor_id: string;
  buyer_id: string | null;

  buyer_email: string | null;
  delivery_method: DeliveryMethod;

  expected_delivery_start: string | null;
  expected_delivery_end: string | null;
  actual_delivery_date: string | null;

  subtotal: number;
  delivery_fee: number | null;
  discount_amount: number | null;
  total_amount: number;
  currency: string;

  payment_status: PaymentStatus;
  payment_proof_url: string | null;
  payment_confirmed_at: string | null;
  payment_notes: string | null;

  status: OrderStatus;
  refund_status: RefundStatus;

  confirmed_at: string | null;
  in_progress_at: string | null;
  ready_for_dispatch_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  refund_initiated_at: string | null;
  refunded_at: string | null;
  resolved_at: string | null;

  auto_close_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;

  refund_reason: string | null;
  refund_amount: number | null;
  refund_vendor_notes: string | null;

  vendor_notes: string | null;
  order_notes: string | null;

  created_at: string;
  updated_at: string;

  items: OrderItem[];
  vendor: OrderVendor;
  status_history: OrderStatusHistoryEntry[];
  review: Review | null;
}

export interface OrderListItem extends Omit<Order, 'vendor' | 'status_history' | 'review'> {
  vendor: Pick<OrderVendor, 'id' | 'business_name'>;
}

export interface CreateOrderInput {
  buyer_email?: string;
  delivery_method: DeliveryMethod;
  expected_delivery_start?: string;
  expected_delivery_end?: string;
  items: {
    product_id?: string;
    item_name: string;
    item_price: number;
    quantity: number;
    description?: string;
  }[];
  delivery_fee?: number;
  discount_amount?: number;
  order_notes?: string;
  vendor_notes?: string;
}

export interface UpdateOrderInput {
  buyer_email?: string;
  delivery_method?: DeliveryMethod;
  expected_delivery_start?: string;
  expected_delivery_end?: string;
  items?: {
    product_id?: string;
    item_name: string;
    item_price: number;
    quantity: number;
    description?: string;
  }[];
  delivery_fee?: number;
  discount_amount?: number;
  order_notes?: string;
  vendor_notes?: string;
}

export interface OrderFilters {
  status?: string;
  refund_status?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc';
  from_date?: string;
  to_date?: string;
}

export interface OrderListResponse {
  data: OrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderAnalytics {
  all_time_completed: number;
  this_month: {
    total_orders: number;
    completed: number;
    revenue: number;
    completion_rate: number;
    refund_rate: number;
    by_status: Record<string, number>;
  };
}

// ============================================================

export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  subcategories: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REVIEW & TRUST TYPES
// ============================================================

export interface Review {
  id: string;
  overall_rating: number;
  delivery_rating: number | null;
  response_rating: number | null;
  satisfaction_rating: number | null;
  buyer_name: string | null;
  review_text: string | null;
  created_at: string;
}

export interface ReviewSummary {
  total_reviews: number;
  distribution: Record<number, number>;
}

export interface ReviewListResponse {
  success: boolean;
  data: Review[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: ReviewSummary;
}

export interface TrustMetrics {
  // Performance — system-calculated from order data
  total_orders: number;
  successful_orders: number;
  fulfillment_rate: number;
  refund_rate: number;
  on_time_delivery_rate: number;
  avg_response_time_minutes: number;
  last_order_at: string | null;
  // Customer feedback — derived from approved review ratings
  review_count: number;
  average_rating: number;
  avg_delivery_rating: number;
  avg_response_rating: number;
  customer_satisfaction_rating: number;
}

export interface CreateReviewInput {
  tracking_token: string;
  overall_rating: number;
  delivery_rating?: number;
  response_rating?: number;
  satisfaction_rating?: number;
  buyer_name?: string;
  review_text?: string;
}

export interface PublicVendorProfileProfile {
  id: string;
  business_name: string | null;
  slug: string | null;
  profile_photo_url: string | null;
  business_description: string | null;
  state: string | null;
  city: string | null;
  street_address: string | null;
  landmark: string | null;
  primary_category: string | null;
  current_tier: string;
  payment_models: string[];
  refund_policy_type: string;
  refund_duration_days: number | null;
  refund_conditions: string[];
  refund_custom_notes: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_url: string | null;
  whatsapp_number: string | null;
  primary_contact: string | null;
  created_at: string;
  verified_types: string[];
}

export interface PublicVendorProfileProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_status: string;
  media: Array<{ media_url: string; media_type: string }>;
}

export interface PublicVendorProfileProducts {
  data: PublicVendorProfileProduct[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublicVendorProfile {
  profile: PublicVendorProfileProfile;
  trustMetrics: TrustMetrics;
  reviews: ReviewListResponse;
  products: PublicVendorProfileProducts;
}

export interface PublicProductDetailMedia {
  id: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO';
  is_primary: boolean;
  position: number;
}

export interface PublicProductDetail {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  media: PublicProductDetailMedia[];
  vendor: {
    whatsapp_number: string | null;
    primary_contact: PrimaryContactMethod | null;
    phone_number: string | null;
    instagram_handle: string | null;
    tiktok_handle: string | null;
    facebook_url: string | null;
  };
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
