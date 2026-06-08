import { Router } from 'express';
import { OrderController } from '@controllers/orderController.js';

const trackRouter = Router();

/** GET /api/v1/track/:token — Get order by tracking token (public). */
trackRouter.get('/:token', OrderController.getOrderByToken);
/** POST /api/v1/track/:token/submit-payment — Buyer submits payment proof (public). */
trackRouter.post('/:token/submit-payment', OrderController.submitPaymentProof);
/** POST /api/v1/track/:token/cancel — Buyer cancels a PENDING order (public). */
trackRouter.post('/:token/cancel', OrderController.buyerCancelOrder);
/** POST /api/v1/track/:token/confirm-delivery — Buyer confirms DELIVERED order (public). */
trackRouter.post('/:token/confirm-delivery', OrderController.buyerConfirmDelivery);
/** POST /api/v1/track/:token/request-refund — Buyer requests refund (public). */
trackRouter.post('/:token/request-refund', OrderController.buyerRequestRefund);
/** POST /api/v1/track/:token/close — Buyer closes a REFUNDED or RESOLVED order (public). */
trackRouter.post('/:token/close', OrderController.buyerCloseResolution);

export default trackRouter;
