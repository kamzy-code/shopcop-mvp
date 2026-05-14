import { UserController } from '@controllers/userController.js';
import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';

const userRouter = Router();

// GET /api/v1/user/me
userRouter.get('/me', authenticate, UserController.getCurrentUser);

// PUT /api/v1/user/profile
userRouter.put('/profile', authenticate, UserController.updateProfile);

// Example of an admin-only route (if needed in the future)
userRouter.get('/admin-only', authenticate, requireAdmin, UserController.listUsers);

export default userRouter;
