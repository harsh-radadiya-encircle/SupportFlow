import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.get('/businesses', UsersController.getActiveBusinesses);
router.post('/fcm-token', authenticate, UsersController.saveFcmToken);
router.patch('/profile', authenticate, UsersController.updateProfile);

router.get('/admin/all', authenticate, authorize(['PLATFORM_ADMIN']), UsersController.getAllUsers);

router.delete(
  '/admin/:userId',
  authenticate,
  authorize(['PLATFORM_ADMIN']),
  UsersController.deleteUser
);

export default router;
