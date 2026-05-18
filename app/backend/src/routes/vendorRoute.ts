import { Router } from 'express';
import { VendorProfileController } from '@controllers/vendorController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const vendorRouter = Router();

// All routes require vendor authentication
vendorRouter.use(authenticate);
vendorRouter.use(requireVendor);

/**
 * // Update personal info (Step 1)
 * api/v1/vendors/personal-info
 */
vendorRouter.post('/personal-info', VendorProfileController.updatePersonalInfo);

/**
 * Update business info (Step 2)
 * api/v1/vendors/business-info
 * */
vendorRouter.post('/business-info', VendorProfileController.updateBusinessInfo);

/**
 * Get profile
 * api/v1/vendors/
 */
vendorRouter.get('/', VendorProfileController.getVendorProfile);

/**
 *  Get profile completeness breakdown
 * api/vendors/completeness
 */
vendorRouter.get('/completeness', VendorProfileController.getProfileCompleteness);

export default vendorRouter;
