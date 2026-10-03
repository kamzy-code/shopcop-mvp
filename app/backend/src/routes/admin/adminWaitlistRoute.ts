import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminWaitlistController } from '@controllers/admin/adminWaitlistController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/waitlist — List waitlist entries with optional filters and pagination. */
router.get('/', AdminWaitlistController.listWaitlistEntries);

/** GET /api/v1/admin/waitlist/:id — Get a single waitlist entry. */
router.get('/:id', AdminWaitlistController.getWaitlistEntry);

/** PATCH /api/v1/admin/waitlist/:id/status — Update follow-up status of a waitlist entry. */
router.patch('/:id/status', AdminWaitlistController.updateWaitlistStatus);

export default router;