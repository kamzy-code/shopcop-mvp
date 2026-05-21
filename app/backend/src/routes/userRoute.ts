import { UserController } from '@controllers/userController.js';
import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';

const userRouter = Router();

/** GET /api/v1/users/me — Get authenticated user's profile. */
userRouter.get('/me', authenticate, UserController.getCurrentUser);

/** PUT /api/v1/users/profile — Update display name and/or avatar. */
userRouter.put('/profile', authenticate, UserController.updateProfile);

/** GET /api/v1/users/admin-only — List all users (admin only). */
userRouter.get('/admin-only', authenticate, requireAdmin, UserController.listUsers);

export default userRouter;
