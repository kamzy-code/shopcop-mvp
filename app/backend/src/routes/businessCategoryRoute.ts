import { Router } from 'express';
import { BusinessCategoryController } from '@controllers/businessCategoryController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';

const categoryRouter = Router();

/** GET /api/v1/categories — public, returns all active categories with subcategories */
categoryRouter.get('/', BusinessCategoryController.getAllCategories);

/** GET /api/v1/categories/:id — public, returns a single category by ID */
categoryRouter.get('/:id', BusinessCategoryController.getCategoryById);

/** POST /api/v1/categories — admin only: create a new category */
categoryRouter.post('/', authenticate, requireAdmin, BusinessCategoryController.createCategory);

/** PATCH /api/v1/categories/:id — admin only: partially update a category */
categoryRouter.patch('/:id', authenticate, requireAdmin, BusinessCategoryController.updateCategory);

/** DELETE /api/v1/categories/:id — admin only: soft-delete a category (is_active → false) */
categoryRouter.delete('/:id', authenticate, requireAdmin, BusinessCategoryController.deleteCategory);

export default categoryRouter;
