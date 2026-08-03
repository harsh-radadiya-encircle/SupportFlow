import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../common/types";
import { SubscriptionsService } from "./subscriptions.service";
import {
  createCheckoutSessionSchema,
  verifyPaymentSchema,
} from "./subscriptions.schema";
import { ApiError } from "../../common/exceptions/apiError";

export class SubscriptionsController {
  /**
   * GET /api/v1/subscriptions/current
   */
  static async getCurrentSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user;
      if (!user?.businessId) {
        return res.status(200).json({
          success: true,
          data: {
            businessId: "",
            name: "No Business Associated",
            plan: "FREE",
            subscriptionStatus: "ACTIVE",
            currentPeriodEnd: null,
            daysRemaining: null,
            razorpayCustomerId: null,
            usage: {
              agents: { used: 0, max: 1, percentage: 0 },
              tickets: { used: 0, max: 25, percentage: 0 },
            },
            billingHistory: [],
          },
        });
      }

      const details = await SubscriptionsService.getSubscriptionDetails(
        user.businessId,
      );
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/razorpay-order (Create Razorpay Order)
   */
  static async createRazorpayOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user!;
      const dto = createCheckoutSessionSchema.parse(req.body);

      const result = await SubscriptionsService.createRazorpayOrder(
        dto.plan,
        dto.billingCycle,
        user,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/verify-payment (Verify Razorpay HMAC Signature)
   */
  static async verifyPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user!;
      const dto = verifyPaymentSchema.parse(req.body);

      const result = await SubscriptionsService.verifyRazorpayPayment(
        dto,
        user,
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/cancel (Cancel Subscription and Downgrade)
   */
  static async cancelSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user!;
      const result = await SubscriptionsService.cancelSubscription(user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/webhook (Razorpay Webhook)
   */
  static async handleWebhook(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      if (!signature) {
        throw ApiError.badRequest("Missing x-razorpay-signature header.");
      }

      const result = await SubscriptionsService.handleRazorpayWebhook(
        req.body,
        signature,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
