export interface ReviewMediaInput {
  media_url: string;
  public_id?: string;
  media_type?: 'IMAGE' | 'VIDEO';
  position?: number;
}

export interface ReviewMediaData {
  id: string;
  media_url: string;
  public_id: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  position: number;
}

export interface CreateReviewInput {
  tracking_token: string;
  overall_rating: number;
  delivery_rating?: number;
  response_rating?: number;
  satisfaction_rating?: number;
  buyer_name?: string;
  review_text?: string;
  buyer_id?: string;
  media?: ReviewMediaInput[];
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
  media?: ReviewMediaData[];
}

export interface EditReviewInput {
  tracking_token: string;
  review_text: string | null;
  media?: ReviewMediaInput[];
}

export interface ReviewSummary {
  total_reviews: number;
  distribution: Record<number, number>;
}
