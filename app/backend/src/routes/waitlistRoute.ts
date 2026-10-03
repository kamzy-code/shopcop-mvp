import { Router } from 'express';
import { WaitlistController } from '@controllers/waitlistController.js';

const waitlistRouter = Router();

/** POST /api/v1/waitlist — public: join the waitlist (upserts on existing email) */
waitlistRouter.post('/', WaitlistController.joinWaitlist);

export default waitlistRouter;