import { Router } from 'express';
import { ReviewController } from '@controllers/reviewController.js';

const reviewRouter = Router();

/** POST /api/v1/reviews — Submit a review using tracking token. */
reviewRouter.post('/', ReviewController.createReview);

/** GET /api/v1/reviews — Define only the POST here. Vendor reviews are mounted separately. */
export default reviewRouter;

/** Router for vendor-scoped review endpoints. */
export const vendorReviewRouter = Router();

/** GET /api/v1/vendors/:vendorId/reviews — List reviews for a vendor. */
vendorReviewRouter.get('/:vendorId/reviews', ReviewController.getVendorReviews);
