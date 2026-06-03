import { RefundPolicyType } from "generated/prisma/enums.js";
import { ReviewData, ReviewSummary } from "./reviewTypes.js";

export interface PerformanceMetrics {
  total_transactions: number;
  successful_transactions: number;
  fulfillment_rate: number;
  refund_rate: number;
  on_time_delivery_rate: number;
  avg_response_time_minutes: number;
  last_transaction_at: Date | null;
}

export interface FeedbackMetrics {
  review_count: number;
  average_rating: number;
  avg_delivery_rating: number;
  avg_response_rating: number;
  customer_satisfaction_rating: number;
}

/** Combined trust metrics returned by the API — includes both performance and feedback groups. */
export interface TrustMetrics extends PerformanceMetrics, FeedbackMetrics {}

export interface PublicProfileResult {
  profile: {
    id: string;
    business_name: string | null;
    slug: string | null;
    profile_photo_url: string | null;
    business_description: string | null;
    state: string | null;
    city: string | null;
    primary_category: string | null;
    current_tier: string;
    refund_policy_type: RefundPolicyType;
    refund_duration_days: number | null;
    refund_conditions: string[];
    refund_custom_notes: string | null;
    instagram_handle: string | null;
    tiktok_handle: string | null;
    facebook_url: string | null;
    whatsapp_number: string | null;
    primary_contact: string | null;
    created_at: Date;
  };
  trustMetrics: TrustMetrics;
  reviews: {
    data: ReviewData[];
    summary: ReviewSummary;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  products: {
    data: Array<{
      id: string;
      name: string;
      price: number;
      category: string;
      stock_status: string;
      media: Array<{ media_url: string; media_type: string }>;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
