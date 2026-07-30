import express, { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public Webhook Endpoint for Razorpay Event Signature Verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  SubscriptionsController.handleWebhook as any
);

// Protected Route for any Authenticated User (Business Admins & Support Agents)
router.get('/current', authenticate as any, SubscriptionsController.getCurrentSubscription as any);

// Protected Business Admin Subscription Management Routes
router.use(authenticate as any, authorize(['BUSINESS_ADMIN']) as any);

router.post('/razorpay-order', SubscriptionsController.createRazorpayOrder as any);
router.post('/verify-payment', SubscriptionsController.verifyPayment as any);
router.post('/cancel', SubscriptionsController.cancelSubscription as any);

export default router;
