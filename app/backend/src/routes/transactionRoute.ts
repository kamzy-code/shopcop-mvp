import { Router } from 'express';
import { TransactionController } from '@controllers/transactionController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const transactionRouter = Router();

transactionRouter.use(authenticate);
transactionRouter.use(requireVendor);

transactionRouter.get('/analytics/summary', TransactionController.getAnalytics);
transactionRouter.post('/', TransactionController.createTransaction);
transactionRouter.get('/', TransactionController.getTransactions);
transactionRouter.get('/:id', TransactionController.getTransaction);
transactionRouter.patch('/:id', TransactionController.updateTransaction);
transactionRouter.patch('/:id/status', TransactionController.updateStatus);
transactionRouter.patch('/:id/confirm-payment', TransactionController.confirmPayment);
transactionRouter.delete('/:id', TransactionController.cancelTransaction);

export default transactionRouter;
