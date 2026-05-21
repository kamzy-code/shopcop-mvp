import { Router } from 'express';
import { VerificationController } from '@controllers/verificationController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const verificationRouter = Router();

// All routes require vendor authentication
verificationRouter.use(authenticate);
verificationRouter.use(requireVendor);

/** POST /api/v1/verifications/nin — Submit NIN identity verification. */
verificationRouter.post('/nin', VerificationController.submitNINVerification);

/** POST /api/v1/verifications/cac — Submit CAC registration verification. */
verificationRouter.post('/cac', VerificationController.submitCACVerification);

/** POST /api/v1/verifications/smedan — Submit SMEDAN registration verification. */
verificationRouter.post('/smedan', VerificationController.submitSMEDANVerification);

/** POST /api/v1/verifications/address — Submit address document verification. */
verificationRouter.post('/address', VerificationController.submitAddressVerification);

/** GET /api/v1/verifications — Get all verifications for current vendor. */
verificationRouter.get('/', VerificationController.getMyVerifications);

/** GET /api/v1/verifications/:id — Get a single verification by ID. */
verificationRouter.get('/:id', VerificationController.getVerificationById);

/** PATCH /api/v1/verifications/:id/resubmit — Resubmit a rejected verification. */
verificationRouter.patch('/:id/resubmit', VerificationController.resubmitVerification);

export default verificationRouter;