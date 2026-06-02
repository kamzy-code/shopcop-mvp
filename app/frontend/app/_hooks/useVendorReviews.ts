import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { ReviewListResponse } from '../_types';

export const useVendorReviews = (vendorId: string, page = 1, limit = 10) =>
  useQuery<ReviewListResponse>({
    queryKey: ['vendor-reviews', vendorId, page, limit],
    queryFn: async () => {
      const res = await apiFetch<ReviewListResponse['data']>(
        `/vendors/${vendorId}/reviews?page=${page}&limit=${limit}`
      );
      const response = res as unknown as ReviewListResponse & { summary: ReviewListResponse['summary'] };
      return {
        success: true,
        data: response.data,
        meta: response.meta,
        summary: response.summary,
      };
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  });
