import { Router } from 'express';
import { PublicProfileController } from '@controllers/publicProfileController.js';
import { ReviewController } from '@controllers/reviewController.js';

const publicProfileRouter = Router();

/** GET /api/v1/public/vendors/:slug — Public vendor profile (no auth required). */
publicProfileRouter.get('/vendors/:slug', PublicProfileController.getPublicProfile);

/** GET /api/v1/public/vendors/:vendorId/reviews — Paginated approved reviews for a vendor. */
publicProfileRouter.get('/vendors/:vendorId/reviews', ReviewController.getVendorReviews);

export default publicProfileRouter;
