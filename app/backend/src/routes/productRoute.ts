import { Router } from 'express';
import { ProductController } from '@controllers/productController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const productRouter = Router();

productRouter.use(authenticate);
productRouter.use(requireVendor);

productRouter.post('/', ProductController.createProduct);
productRouter.get('/', ProductController.getProducts);
productRouter.get('/:id', ProductController.getProductById);
productRouter.patch('/:id', ProductController.updateProduct);
productRouter.delete('/:id', ProductController.deleteProduct);
productRouter.post('/:id/duplicate', ProductController.duplicateProduct);

export default productRouter;
