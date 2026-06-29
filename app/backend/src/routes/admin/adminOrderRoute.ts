import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminOrderController } from '@controllers/admin/adminOrderController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/orders — List orders across all vendors with filters, search, pagination. */
router.get('/', AdminOrderController.listOrders);

/** GET /api/v1/admin/orders/analytics — Platform-wide order analytics + needing-attention queue. */
router.get('/analytics', AdminOrderController.getAnalytics);

/** GET /api/v1/admin/orders/:id — Order detail for admin review (monitoring only — no mutation actions). */
router.get('/:id', AdminOrderController.getOrder);

export default router;
