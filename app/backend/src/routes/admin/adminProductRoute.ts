import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminProductController } from '@controllers/admin/adminProductController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/products — List products across all vendors with filters, search, and pagination. */
router.get('/', AdminProductController.listProducts);

/** GET /api/v1/admin/products/analytics — Platform-wide quick stats and top performers. */
router.get('/analytics', AdminProductController.getAnalytics);

/** GET /api/v1/admin/products/:id — Product detail with vendor info and sales analytics. */
router.get('/:id', AdminProductController.getProduct);

/** PATCH /api/v1/admin/products/:id — Admin full-override edit of a product. */
router.patch('/:id', AdminProductController.updateProduct);

/** PATCH /api/v1/admin/products/:id/flag — Flag a product for quality review (non-blocking). */
router.patch('/:id/flag', AdminProductController.flagProduct);

/** PATCH /api/v1/admin/products/:id/approve — Clear a product's flag. */
router.patch('/:id/approve', AdminProductController.approveProduct);

/** DELETE /api/v1/admin/products/:id — Admin archive (soft delete) a product. */
router.delete('/:id', AdminProductController.archiveProduct);

export default router;
