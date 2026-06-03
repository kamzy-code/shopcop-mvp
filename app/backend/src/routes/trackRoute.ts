import { Router } from 'express';
import { TransactionController } from '@controllers/transactionController.js';

const trackRouter = Router();

/** GET /api/v1/track/:token — Get transaction by tracking token (public). */
trackRouter.get('/:token', TransactionController.getTransactionByToken);
/** POST /api/v1/track/:token/submit-payment — Buyer submits payment proof (public). */
trackRouter.post('/:token/submit-payment', TransactionController.submitPaymentProof);
/** POST /api/v1/track/:token/cancel — Buyer cancels a PENDING order (public). */
trackRouter.post('/:token/cancel', TransactionController.buyerCancelTransaction);
/** POST /api/v1/track/:token/confirm-delivery — Buyer confirms DELIVERED order (public). */
trackRouter.post('/:token/confirm-delivery', TransactionController.buyerConfirmDelivery);
/** POST /api/v1/track/:token/request-refund — Buyer requests refund (public). */
trackRouter.post('/:token/request-refund', TransactionController.buyerRequestRefund);
/** POST /api/v1/track/:token/close — Buyer closes a REFUNDED or RESOLVED order (public). */
trackRouter.post('/:token/close', TransactionController.buyerCloseResolution);

export default trackRouter;
