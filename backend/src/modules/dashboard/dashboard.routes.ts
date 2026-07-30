import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);

router.get(
  '/business',
  authorize(['BUSINESS_ADMIN']),
  controller.getBusinessAdminMetrics.bind(controller)
);

router.get(
  '/agent',
  authorize(['SUPPORT_AGENT', 'BUSINESS_ADMIN']),
  controller.getAgentMetrics.bind(controller)
);

router.get(
  '/platform',
  authorize(['PLATFORM_ADMIN']),
  controller.getPlatformAdminMetrics.bind(controller)
);

router.patch(
  '/platform/businesses/:businessId/toggle-suspend',
  authorize(['PLATFORM_ADMIN']),
  controller.toggleBusinessSuspension.bind(controller)
);

export default router;
