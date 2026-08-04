import express, { Router } from "express";
import { SubscriptionsController } from "./subscriptions.controller";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";

const router = Router();

// Public Webhook — raw body required for HMAC verification
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  SubscriptionsController.handleWebhook as any,
);

// Any authenticated user can view their subscription
router.get(
  "/current",
  authenticate as any,
  SubscriptionsController.getCurrentSubscription as any,
);

// Business Admin only routes
router.use(authenticate as any, authorize(["BUSINESS_ADMIN"]) as any);

router.post(
  "/razorpay-order",
  SubscriptionsController.createRazorpayOrder as any,
);
router.post("/verify-payment", SubscriptionsController.verifyPayment as any);
router.post("/cancel", SubscriptionsController.cancelSubscription as any);
router.post("/downgrade", SubscriptionsController.scheduleDowngrade as any);

export default router;
