import { Router } from 'express';
import { OrderController } from '@controllers/orderController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const orderRouter = Router();

orderRouter.use(authenticate);
orderRouter.use(requireVendor);

/** GET /api/v1/orders/analytics/summary — Monthly / all-time analytics. */
orderRouter.get('/analytics/summary', OrderController.getAnalytics);
/** POST /api/v1/orders — Create a new order. */
orderRouter.post('/', OrderController.createOrder);
/** GET /api/v1/orders — List vendor's orders with filters and pagination. */
orderRouter.get('/', OrderController.getOrders);
/** GET /api/v1/orders/:id — Get a single order. */
orderRouter.get('/:id', OrderController.getOrder);
/** PATCH /api/v1/orders/:id — Update order metadata or items (PENDING only). */
orderRouter.patch('/:id', OrderController.updateOrder);
/** PATCH /api/v1/orders/:id/status — Advance status along the state machine. */
orderRouter.patch('/:id/status', OrderController.updateStatus);
/** PATCH /api/v1/orders/:id/confirm-payment — Confirm payment + deduct stock. */
orderRouter.patch('/:id/confirm-payment', OrderController.confirmPayment);
/** DELETE /api/v1/orders/:id — Cancel order + restore stock. */
orderRouter.delete('/:id', OrderController.cancelOrder);
/** PATCH /api/v1/orders/:id/refund-status — Update status with refund_amount and refund_vendor_notes. */
orderRouter.patch('/:id/refund-status', OrderController.updateRefundStatus);

export default orderRouter;
