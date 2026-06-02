export interface CreateReviewInput {
  tracking_token: string;
  overall_rating: number;
  delivery_rating?: number;
  response_rating?: number;
  satisfaction_rating?: number;
  buyer_name?: string;
  review_text?: string;
}

export interface ReviewData {
  id: string;
  overall_rating: number;
  delivery_rating: number | null;
  response_rating: number | null;
  satisfaction_rating: number | null;
  buyer_name: string | null;
  review_text: string | null;
  created_at: Date;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
}
