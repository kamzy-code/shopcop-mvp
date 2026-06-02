import { Router } from 'express';
import { TrustMetricsController } from '@controllers/trustMetricsController.js';
import { authenticate } from '@middleware/authMiddleware.js';
import { requireVendor } from '@middleware/rbac.js';

const trustMetricsRouter = Router();

trustMetricsRouter.use(authenticate);
trustMetricsRouter.use(requireVendor);

/** GET /api/v1/vendors/trust-metrics — Get authenticated vendor's trust metrics. */
trustMetricsRouter.get('/', TrustMetricsController.getTrustMetrics);

export default trustMetricsRouter;
