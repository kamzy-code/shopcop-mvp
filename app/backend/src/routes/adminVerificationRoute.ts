import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminVerificationController } from '@controllers/admin/adminVerificationController.js';

const router = Router();


// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Get verifications
router.get('/stats', AdminVerificationController.getVerificationStats);
router.get('/:id', AdminVerificationController.getVerificationDetails);
router.get('/', AdminVerificationController.getAllVerifications);

// Approve/reject verifications
router.patch('/:id/approve', AdminVerificationController.approveVerification);
router.patch('/:id/reject', AdminVerificationController.rejectVerification);

// Get signed URL for private documents
router.get('/:id/signed-url', AdminVerificationController.getSignedUrl);

// Get vendor tier breakdown
router.get('/vendors/:vendorId/tier-breakdown', AdminVerificationController.getVendorTierBreakdown);
export default router;
