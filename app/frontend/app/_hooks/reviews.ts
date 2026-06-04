import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { ApiResponse, CreateReviewInput, Review, ReviewListResponse, ReviewSummary } from '../_types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditReviewTextInput {
  tracking_token: string;
  review_text: string | null;
}

/**
 * The reviews list endpoint returns `meta` and `summary` as top-level siblings
 * of `data`. We extend ApiResponse to capture the full shape.
 */
type ReviewsApiResponse = ApiResponse<Review[]> & {
  meta: ReviewListResponse['meta'];
  summary: ReviewSummary;
};

// ─── useCreateReview ──────────────────────────────────────────────────────────

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewInput) => {
      const res = await apiFetch<Review>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-public'] });
    },
  });
};

// ─── useEditReview ────────────────────────────────────────────────────────────

export const useEditReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EditReviewTextInput) => {
      const res = await apiFetch<Review>('/reviews', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-public'] });
    },
  });
};

// ─── useVendorReviews ─────────────────────────────────────────────────────────

export const useVendorReviews = (
  vendorId: string,
  page = 1,
  limit = 10,
  minRating?: number,
  maxRating?: number
) =>
  useQuery<ReviewListResponse>({
    queryKey: ['vendor-reviews', vendorId, page, limit, minRating, maxRating],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (minRating !== undefined) params.set('min_rating', String(minRating));
      if (maxRating !== undefined) params.set('max_rating', String(maxRating));
      const res = await apiFetch<Review[]>(`/public/vendors/${vendorId}/reviews?${params}`);
      const { data, meta, summary } = res as ReviewsApiResponse;
      return { success: true, data, meta, summary };
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  });
