import { Router } from 'express';
import { ReviewController } from '@controllers/reviewController.js';

const reviewRouter = Router();

/** POST /api/v1/reviews — Submit a review using tracking token (no auth required). */
reviewRouter.post('/', ReviewController.createReview);

/** PATCH /api/v1/reviews — Edit review text and/or media within 7-day window (token-authenticated). */
reviewRouter.patch('/', ReviewController.editReview);

export default reviewRouter;
