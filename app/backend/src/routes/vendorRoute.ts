import { Router } from 'express';
import { VendorProfileController } from '@controllers/vendorController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const vendorRouter = Router();

// All routes require vendor authentication
vendorRouter.use(authenticate);
vendorRouter.use(requireVendor);

/** POST /api/v1/vendors/personal-info — Update personal info (Step 1). */
vendorRouter.post('/personal-info', VendorProfileController.updatePersonalInfo);

/** POST /api/v1/vendors/business-info — Update business info (Step 2). */
vendorRouter.post('/business-info', VendorProfileController.updateBusinessInfo);

/** GET /api/v1/vendors — Get vendor profile with verifications. */
vendorRouter.get('/', VendorProfileController.getVendorProfile);

/** GET /api/v1/vendors/completeness — Get profile completeness breakdown. */
vendorRouter.get('/completeness', VendorProfileController.getProfileCompleteness);

/** PATCH /api/v1/vendors/profile-photo — Update profile photo. */
vendorRouter.patch('/profile-photo', VendorProfileController.updateProfilePhoto);

export default vendorRouter;
