import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/types';
import { SubscriptionsService } from './subscriptions.service';
import { createCheckoutSessionSchema } from './subscriptions.schema';
import { ApiError } from '../../common/exceptions/apiError';

export class SubscriptionsController {
  /**
   * GET /api/v1/subscriptions/current
   */
  static async getCurrentSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.businessId) {
        throw ApiError.badRequest('User is not associated with a business organization.');
      }

      const details = await SubscriptionsService.getSubscriptionDetails(user.businessId);
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/checkout
   */
  static async createCheckoutSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const dto = createCheckoutSessionSchema.parse(req.body);

      const result = await SubscriptionsService.createCheckoutSession(dto.plan, user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/portal
   */
  static async createPortalSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await SubscriptionsService.createBillingPortalSession(user);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/webhook (Raw signature verification)
   */
  static async handleWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        throw ApiError.badRequest('Missing stripe-signature header.');
      }

      const result = await SubscriptionsService.handleStripeWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
