import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Rate-limited Auth Endpoints
router.post('/check-provider', authRateLimiter, AuthController.checkProvider);
router.post('/sync', authRateLimiter, AuthController.syncUser);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/sync-password', authRateLimiter, AuthController.syncPassword);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

// Session & Profile
router.get('/me', authenticate, AuthController.getProfile);
router.get('/custom-token', authenticate, AuthController.getCustomToken);
router.post('/logout', authenticate, AuthController.logout);

export default router;
