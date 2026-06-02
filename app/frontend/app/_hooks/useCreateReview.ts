import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../_lib/fetchWrapper';
import type { Review, CreateReviewInput } from '../_types';

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
