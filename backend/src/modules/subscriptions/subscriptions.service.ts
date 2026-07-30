import crypto from 'crypto';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { razorpay } from '../../config/razorpay';
import { env } from '../../config/env';
import { ApiError } from '../../common/exceptions/apiError';
import { AuthenticatedUser } from '../../common/types';

export class SubscriptionsService {
  /**
   * Get subscription details, seat usage, monthly ticket quota, and invoice history
   */
  static async getSubscriptionDetails(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        billingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!business) {
      throw ApiError.notFound('Business profile not found.');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [agentCount, monthlyTicketCount] = await Promise.all([
      prisma.user.count({
        where: {
          businessId,
          role: 'SUPPORT_AGENT',
          isActive: true,
        },
      }),
      prisma.ticket.count({
        where: {
          businessId,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const agentLimits: Record<SubscriptionPlan, number> = {
      FREE: 1,
      STANDARD: 5,
      BUSINESS: 20,
    };

    const maxAgents = agentLimits[business.plan] || 1;

    return {
      businessId: business.id,
      name: business.name,
      plan: business.plan,
      subscriptionStatus: business.subscriptionStatus,
      currentPeriodEnd: business.currentPeriodEnd,
      razorpayCustomerId: business.razorpayCustomerId,
      usage: {
        agents: {
          used: agentCount,
          max: maxAgents,
          percentage: Math.min(100, Math.round((agentCount / maxAgents) * 100)),
        },
        tickets: {
          used: monthlyTicketCount,
          max: business.plan === 'FREE' ? 25 : 'Unlimited',
          percentage:
            business.plan === 'FREE' ? Math.min(100, Math.round((monthlyTicketCount / 25) * 100)) : 0,
        },
      },
      billingHistory: business.billingHistory,
    };
  }

  /**
   * Create Razorpay Order for Plan Upgrades
   */
  static async createRazorpayOrder(plan: 'STANDARD' | 'BUSINESS', user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest('You must be associated with a business to upgrade plans.');
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      throw ApiError.notFound('Business profile not found.');
    }

    const isRealRazorpayKey =
      env.RAZORPAY.KEY_ID &&
      env.RAZORPAY.KEY_ID.startsWith('rzp_') &&
      env.RAZORPAY.KEY_ID !== 'rzp_test_mock';

    // Development / Test Fallback Mode if real Razorpay keys are not set in backend/.env
    if (!isRealRazorpayKey) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          plan: plan as SubscriptionPlan,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      });

      return {
        isTestMode: true,
        message: `Plan upgraded to ${plan} in Development Mode. (Configure RAZORPAY_KEY_ID in backend/.env for live Razorpay Checkout)`,
      };
    }

    // Determine Amount in INR Paise (₹2,499 = 249900 paise for Standard, ₹6,499 = 649900 paise for Business)
    const amountInPaise = plan === 'STANDARD' ? 249900 : 649900;

    try {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${business.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          businessId: business.id,
          plan,
          userEmail: user.email,
        },
      });

      await prisma.business.update({
        where: { id: business.id },
        data: { razorpayOrderId: order.id },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY.KEY_ID,
        plan,
        businessName: business.name,
        userEmail: user.email,
      };
    } catch (err: any) {
      console.error('[Razorpay Order Creation Error]:', err);
      throw ApiError.badRequest(err.message || 'Failed to create Razorpay payment order.');
    }
  }

  /**
   * Verify Razorpay Payment Signature and Upgrade Subscription
   */
  static async verifyRazorpayPayment(
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: 'STANDARD' | 'BUSINESS';
    },
    user: AuthenticatedUser
  ) {
    if (!user.businessId) {
      throw ApiError.badRequest('No business profile found.');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = payload;

    // HMAC Signature Validation: razorpay_order_id + '|' + razorpay_payment_id
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY.KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw ApiError.badRequest('Invalid Razorpay payment signature verification failed.');
    }

    const amountPaid = plan === 'STANDARD' ? 249900 : 649900;

    // Update Business Plan & Subscription Status in DB
    const business = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        plan: plan as SubscriptionPlan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        razorpayOrderId: razorpay_order_id,
      },
    });

    // Record Billing Receipt in BillingHistory
    await prisma.billingHistory.create({
      data: {
        businessId: business.id,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amountPaid,
        currency: 'INR',
        status: 'captured',
      },
    }).catch(() => null); // Prevent crash if duplicate

    return {
      success: true,
      message: `Payment successful! Business upgraded to ${plan} plan.`,
      plan: business.plan,
    };
  }

  /**
   * Cancel Subscription and Downgrade to Free
   */
  static async cancelSubscription(user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest('No business profile found.');
    }

    const business = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        plan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.CANCELED,
      },
    });

    return {
      success: true,
      message: 'Subscription canceled. Business plan downgraded to Free.',
      plan: business.plan,
    };
  }

  /**
   * Handle Verified Razorpay Webhooks
   */
  static async handleRazorpayWebhook(payloadBuffer: Buffer, signature: string) {
    const webhookSecret = env.RAZORPAY.WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadBuffer)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw ApiError.badRequest('Razorpay Webhook signature verification failed.');
    }

    const body = JSON.parse(payloadBuffer.toString());
    const event = body.event;

    console.log(`[Razorpay Webhook Received]: Event ${event}`);

    switch (event) {
      case 'order.paid':
      case 'payment.captured': {
        const payment = body.payload.payment.entity;
        const notes = payment.notes || {};
        const businessId = notes.businessId;
        const plan = notes.plan as SubscriptionPlan;

        if (businessId && plan) {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              plan,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
            },
          });
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        const subscription = body.payload.subscription.entity;
        const business = await prisma.business.findFirst({
          where: { razorpaySubscriptionId: subscription.id },
        });

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              plan: SubscriptionPlan.FREE,
              subscriptionStatus: SubscriptionStatus.CANCELED,
            },
          });
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    return { status: 'ok' };
  }
}
