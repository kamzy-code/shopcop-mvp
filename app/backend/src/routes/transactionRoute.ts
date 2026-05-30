import { Router } from 'express';
import { TransactionController } from '@controllers/transactionController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const transactionRouter = Router();

transactionRouter.use(authenticate);
transactionRouter.use(requireVendor);

/** GET /api/v1/transactions/analytics/summary — Monthly / all-time analytics. */
transactionRouter.get('/analytics/summary', TransactionController.getAnalytics);
/** POST /api/v1/transactions — Create a new transaction. */
transactionRouter.post('/', TransactionController.createTransaction);
/** GET /api/v1/transactions — List vendor's transactions with filters and pagination. */
transactionRouter.get('/', TransactionController.getTransactions);
/** GET /api/v1/transactions/:id — Get a single transaction. */
transactionRouter.get('/:id', TransactionController.getTransaction);
/** PATCH /api/v1/transactions/:id — Update transaction metadata or items (PENDING only). */
transactionRouter.patch('/:id', TransactionController.updateTransaction);
/** PATCH /api/v1/transactions/:id/status — Advance status along the state machine. */
transactionRouter.patch('/:id/status', TransactionController.updateStatus);
/** PATCH /api/v1/transactions/:id/confirm-payment — Confirm payment + deduct stock. */
transactionRouter.patch('/:id/confirm-payment', TransactionController.confirmPayment);
/** DELETE /api/v1/transactions/:id — Cancel transaction + restore stock. */
transactionRouter.delete('/:id', TransactionController.cancelTransaction);
/** PATCH /api/v1/transactions/:id/refund-status — Update status with refund_amount and refund_vendor_notes. */
transactionRouter.patch('/:id/refund-status', TransactionController.updateRefundStatus);

export default transactionRouter;
