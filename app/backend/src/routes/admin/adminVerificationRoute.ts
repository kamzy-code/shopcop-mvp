import { Router } from 'express';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireAdmin } from '@middleware/rbac.js';
import { AdminVerificationController } from '@controllers/admin/adminVerificationController.js';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/** GET /api/v1/admin/verifications — Get all verifications with filters. */
router.get('/', AdminVerificationController.getAllVerifications);

/** GET /api/v1/admin/verifications/stats — Get verification dashboard stats. */
router.get('/stats', AdminVerificationController.getVerificationStats);

/** GET /api/v1/admin/verifications/:id — Get full verification details. */
router.get('/:id', AdminVerificationController.getVerificationDetails);

/** GET /api/v1/admin/verifications/:id/signed-url — Get signed Cloudinary URLs for documents. */
router.get('/:id/signed-url', AdminVerificationController.getSignedUrl);

/** PATCH /api/v1/admin/verifications/:id/approve — Approve a pending verification. */
router.patch('/:id/approve', AdminVerificationController.approveVerification);

/** PATCH /api/v1/admin/verifications/:id/reject — Reject a pending verification. */
router.patch('/:id/reject', AdminVerificationController.rejectVerification);

/** GET /api/v1/admin/vendors/:vendorId/tier-breakdown — Get vendor tier breakdown. */
router.get('/vendors/:vendorId/tier-breakdown', AdminVerificationController.getVendorTierBreakdown);

export default router;
