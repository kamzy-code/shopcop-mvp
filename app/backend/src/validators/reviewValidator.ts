import { z } from 'zod';

export const createReviewSchema = z.object({
  tracking_token: z.string().min(1, 'Tracking token is required'),
  overall_rating: z.number().int('Rating must be a whole number').min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  delivery_rating: z.number().int().min(1).max(5).optional(),
  response_rating: z.number().int().min(1).max(5).optional(),
  satisfaction_rating: z.number().int().min(1).max(5).optional(),
  buyer_name: z.string().max(100, 'Name too long').optional(),
  review_text: z.string().max(2000, 'Review text too long').optional(),
});
