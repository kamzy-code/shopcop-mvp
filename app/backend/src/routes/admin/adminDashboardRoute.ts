import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminDashboardController } from '@controllers/admin/adminDashboardController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/dashboard/stats — Get aggregated platform metrics for the admin dashboard. */
router.get('/stats', AdminDashboardController.getDashboardStats);

export default router;
