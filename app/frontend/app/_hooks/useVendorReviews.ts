import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { ApiResponse, Review, ReviewListResponse, ReviewSummary } from '../_types';

/**
 * The reviews list endpoint returns `meta` and `summary` as top-level siblings
 * of `data` in the JSON body: { success, data: Review[], meta, summary }.
 * ApiResponse<T> only models `{ success, data: T }`, so we extend it here to
 * capture the extra fields that actually exist at runtime.
 */
type ReviewsApiResponse = ApiResponse<Review[]> & {
  meta: ReviewListResponse['meta'];
  summary: ReviewSummary;
};

export const useVendorReviews = (vendorId: string, page = 1, limit = 10) =>
  useQuery<ReviewListResponse>({
    queryKey: ['vendor-reviews', vendorId, page, limit],
    queryFn: async () => {
      const res = await apiFetch<Review[]>(
        `/vendors/${vendorId}/reviews?page=${page}&limit=${limit}`
      );
      // Cast to the extended type — safe because the API always includes meta + summary
      const { data, meta, summary } = res as ReviewsApiResponse;
      return { success: true, data, meta, summary };
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  });
