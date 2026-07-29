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

export default router;
