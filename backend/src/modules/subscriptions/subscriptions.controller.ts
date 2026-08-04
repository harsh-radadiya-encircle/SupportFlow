import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../common/types";
import { SubscriptionsService } from "./subscriptions.service";
import {
  createCheckoutSessionSchema,
  verifyPaymentSchema,
  scheduleDowngradeSchema,
} from "./subscriptions.schema";
import { ApiError } from "../../common/exceptions/apiError";
import { sendResponse } from "../../common/responses/apiResponse";

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
            billingCycle: null,
            cancelAtPeriodEnd: false,
            pendingDowngradePlan: null,
            currentPeriodEnd: null,
            nextBillingDate: null,
            lastPaymentAt: null,
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
      return res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/razorpay-order
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
      sendResponse({
        res,
        statusCode: 200,
        message: "Order created",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/verify-payment
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
      sendResponse({
        res,
        statusCode: 200,
        message: "Payment verified",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/cancel
   * Schedules downgrade to FREE at end of current billing period.
   */
  static async cancelSubscription(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user!;
      const result = await SubscriptionsService.cancelSubscription(user);
      sendResponse({
        res,
        statusCode: 200,
        message: "Cancellation scheduled",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/downgrade
   * Schedules a downgrade to a lower paid plan at end of current billing period.
   */
  static async scheduleDowngrade(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const user = req.user!;
      const dto = scheduleDowngradeSchema.parse(req.body);
      const result = await SubscriptionsService.scheduleDowngrade(
        dto.targetPlan,
        user,
      );
      sendResponse({
        res,
        statusCode: 200,
        message: "Downgrade scheduled",
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
