import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminUserController } from '@controllers/admin/adminUserController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/users — List users with optional role/status/search filters and pagination. */
router.get('/', AdminUserController.listUsers);

/** GET /api/v1/admin/users/:id — Get a user's full profile including vendor info. */
router.get('/:id', AdminUserController.getUser);

/** PATCH /api/v1/admin/users/:id/status — Activate or deactivate (ban) a user. */
router.patch('/:id/status', AdminUserController.updateUserStatus);

/** PATCH /api/v1/admin/users/:id/role — Change a user's role. */
router.patch('/:id/role', AdminUserController.updateUserRole);

export default router;
