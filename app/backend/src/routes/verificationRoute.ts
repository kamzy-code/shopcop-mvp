import { Router } from 'express';
import { VerificationController } from '@controllers/verificationController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const verificationRouter = Router();

// All routes require vendor authentication
verificationRouter.use(authenticate);
verificationRouter.use(requireVendor);

// Submit verifications
verificationRouter.post('/nin', VerificationController.submitNINVerification);
verificationRouter.post('/cac', VerificationController.submitCACVerification);
verificationRouter.post('/smedan', VerificationController.submitSMEDANVerification);
verificationRouter.post('/address', VerificationController.submitAddressVerification);

// Get verifications
verificationRouter.get('/', VerificationController.getMyVerifications);
verificationRouter.get('/:id', VerificationController.getVerificationById);

// Resubmit rejected verification
verificationRouter.patch('/:id/resubmit', VerificationController.resubmitVerification);

export default verificationRouter;