import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', NotificationsController.getUserNotifications);
router.patch('/read-all', NotificationsController.markAllAsRead);
router.patch('/:id/read', NotificationsController.markAsRead);

export default router;
