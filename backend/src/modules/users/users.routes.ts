import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.post('/fcm-token', authenticate, UsersController.saveFcmToken);

export default router;
