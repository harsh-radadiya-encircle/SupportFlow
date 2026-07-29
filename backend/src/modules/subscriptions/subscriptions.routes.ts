import express, { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Public Raw Webhook Endpoint for Stripe Event Signature Verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  SubscriptionsController.handleWebhook as any
);

// Protected Business Admin Routes
router.use(authenticate as any, authorize(['BUSINESS_ADMIN']) as any);

router.get('/current', SubscriptionsController.getCurrentSubscription as any);
router.post('/checkout', SubscriptionsController.createCheckoutSession as any);
router.post('/portal', SubscriptionsController.createPortalSession as any);

export default router;
