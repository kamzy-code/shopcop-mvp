import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminProfileController } from '../../controllers/admin/adminProfileController.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', AdminProfileController.getProfile);
router.patch('/', AdminProfileController.updateProfile);

export default router;
