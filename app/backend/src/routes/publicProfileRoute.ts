import { Router } from 'express';
import { PublicProfileController } from '@controllers/publicProfileController.js';

const publicProfileRouter = Router();

/** GET /api/v1/public/vendors/:slug — Public vendor profile (no auth required). */
publicProfileRouter.get('/vendors/:slug', PublicProfileController.getPublicProfile);

export default publicProfileRouter;
