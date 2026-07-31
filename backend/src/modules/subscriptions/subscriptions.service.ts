import crypto from "crypto";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { razorpay } from "../../config/razorpay";
import { env } from "../../config/env";
import { ApiError } from "../../common/exceptions/apiError";
import { AuthenticatedUser } from "../../common/types";
import { NotificationService } from "../../services/notification.service";

export class SubscriptionsService {
  /**
   * Get subscription details, seat usage, monthly ticket quota, current period end & days remaining
   */
  static async getSubscriptionDetails(businessId: string) {
    let business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        billingHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!business) {
      throw ApiError.notFound("Business profile not found.");
    }

    const now = new Date();

    // Auto-Expiry Check: If period has ended and plan is not FREE, auto-revert to FREE plan
    if (
      business.currentPeriodEnd &&
      business.currentPeriodEnd < now &&
      business.plan !== SubscriptionPlan.FREE
    ) {
      business = await prisma.business.update({
        where: { id: businessId },
        data: {
          plan: SubscriptionPlan.FREE,
          subscriptionStatus: SubscriptionStatus.CANCELED,
        },
        include: {
          billingHistory: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [agentCount, monthlyTicketCount] = await Promise.all([
      prisma.user.count({
        where: {
          businessId,
          role: "SUPPORT_AGENT",
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

    // Calculate currentPeriodEnd & daysRemaining (null for FREE plan)
    const currentPeriodEnd =
      business.plan === SubscriptionPlan.FREE
        ? null
        : business.currentPeriodEnd;
    const daysRemaining = currentPeriodEnd
      ? Math.max(
          0,
          Math.ceil(
            (currentPeriodEnd.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

    return {
      businessId: business.id,
      name: business.name,
      plan: business.plan,
      subscriptionStatus: business.subscriptionStatus,
      currentPeriodEnd: currentPeriodEnd
        ? currentPeriodEnd.toISOString()
        : null,
      daysRemaining,
      razorpayCustomerId: business.razorpayCustomerId,
      usage: {
        agents: {
          used: agentCount,
          max: maxAgents,
          percentage: Math.min(100, Math.round((agentCount / maxAgents) * 100)),
        },
        tickets: {
          used: monthlyTicketCount,
          max: business.plan === "FREE" ? 25 : "Unlimited",
          percentage:
            business.plan === "FREE"
              ? Math.min(100, Math.round((monthlyTicketCount / 25) * 100))
              : 0,
        },
      },
      billingHistory: business.billingHistory,
    };
  }

  /**
   * Create Razorpay Order for Plan Upgrades & Downgrades (Monthly & Yearly)
   */
  static async createRazorpayOrder(
    plan: "STANDARD" | "BUSINESS",
    billingCycle: "monthly" | "yearly" = "monthly",
    user: AuthenticatedUser,
  ) {
    if (!user.businessId) {
      throw ApiError.badRequest(
        "You must be associated with a business to manage plans.",
      );
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      throw ApiError.notFound("Business profile not found.");
    }

    const isRealRazorpayKey =
      env.RAZORPAY.KEY_ID &&
      env.RAZORPAY.KEY_ID.startsWith("rzp_") &&
      env.RAZORPAY.KEY_ID !== "rzp_test_mock";

    const durationDays = billingCycle === "yearly" ? 365 : 30;
    const currentPeriodEnd = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    );

    // Development / Test Fallback Mode
    if (!isRealRazorpayKey) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          plan: plan as SubscriptionPlan,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          currentPeriodEnd,
        },
      });

      return {
        isTestMode: true,
        message: `Plan updated to ${plan} (${billingCycle}) in Test Mode. (Access valid until ${currentPeriodEnd.toLocaleDateString()})`,
        plan,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      };
    }

    // Determine Amount in INR Paise
    // Standard: ₹2,499/mo (₹24,990/yr) | Business: ₹6,499/mo (₹64,990/yr)
    let amountInPaise = 249900;
    if (plan === "STANDARD") {
      amountInPaise = billingCycle === "yearly" ? 2499000 : 249900;
    } else if (plan === "BUSINESS") {
      amountInPaise = billingCycle === "yearly" ? 6499000 : 649900;
    }

    try {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${business.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          businessId: business.id,
          plan,
          billingCycle,
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
        billingCycle,
        businessName: business.name,
        userEmail: user.email,
      };
    } catch (err: any) {
      console.error("[Razorpay Order Creation Error]:", err);
      throw ApiError.badRequest(
        err.message || "Failed to create Razorpay payment order.",
      );
    }
  }

  /**
   * Verify Razorpay Payment Signature & Activate Plan with Expiry Timeline
   */
  static async verifyRazorpayPayment(
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: "STANDARD" | "BUSINESS";
      billingCycle?: "monthly" | "yearly";
    },
    user: AuthenticatedUser,
  ) {
    if (!user.businessId) {
      throw ApiError.badRequest("No business profile found.");
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      billingCycle = "monthly",
    } = payload;

    // HMAC Signature Validation
    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY.KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      throw ApiError.badRequest(
        "Invalid Razorpay payment signature verification failed.",
      );
    }

    const durationDays = billingCycle === "yearly" ? 365 : 30;
    const currentPeriodEnd = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    );

    let amountPaid = 249900;
    if (plan === "STANDARD") {
      amountPaid = billingCycle === "yearly" ? 2499000 : 249900;
    } else if (plan === "BUSINESS") {
      amountPaid = billingCycle === "yearly" ? 6499000 : 649900;
    }

    // Update Business Plan & Expiry Date in DB
    const business = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        plan: plan as SubscriptionPlan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        razorpayOrderId: razorpay_order_id,
        currentPeriodEnd,
      },
    });

    // Record Billing Receipt
    await prisma.billingHistory
      .create({
        data: {
          businessId: business.id,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          amountPaid,
          currency: "INR",
          status: "captured",
        },
      })
      .catch(() => null);

    return {
      success: true,
      message: `Payment successful! Business plan set to ${plan} (${billingCycle}). Valid until ${currentPeriodEnd.toLocaleDateString()}.`,
      plan: business.plan,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    };
  }

  /**
   * Cancel Subscription (Retains access until currentPeriodEnd, then downgrades to FREE)
   */
  static async cancelSubscription(user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest("No business profile found.");
    }

    const business = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
      },
    });

    return {
      success: true,
      message:
        "Subscription canceled. Access will remain active until current period end date, then re-set to Free plan.",
      plan: business.plan,
      subscriptionStatus: business.subscriptionStatus,
      currentPeriodEnd: business.currentPeriodEnd?.toISOString(),
    };
  }

  /**
   * Handle Verified Razorpay Webhooks
   */
  static async handleRazorpayWebhook(payloadBuffer: Buffer, signature: string) {
    const webhookSecret = env.RAZORPAY.WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payloadBuffer)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw ApiError.badRequest(
        "Razorpay Webhook signature verification failed.",
      );
    }

    const body = JSON.parse(payloadBuffer.toString());
    const event = body.event;

    console.log(`[Razorpay Webhook Received]: Event ${event}`);

    switch (event) {
      case "order.paid":
      case "payment.captured": {
        const payment = body.payload.payment.entity;
        const notes = payment.notes || {};
        const businessId = notes.businessId;
        const plan = notes.plan as SubscriptionPlan;
        const billingCycle =
          (notes.billingCycle as "monthly" | "yearly") || "monthly";
        const durationDays = billingCycle === "yearly" ? 365 : 30;
        const currentPeriodEnd = new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000,
        );

        if (businessId && plan) {
          const business = await prisma.business.findUnique({
            where: { id: businessId },
          });
          if (business) {
            const oldPlan = business.plan;

            await prisma.business.update({
              where: { id: businessId },
              data: {
                plan,
                subscriptionStatus: SubscriptionStatus.ACTIVE,
                currentPeriodEnd,
              },
            });

            // Determine notification type
            const planLevels: Record<SubscriptionPlan, number> = {
              FREE: 0,
              STANDARD: 1,
              BUSINESS: 2,
            };
            const oldLevel = planLevels[oldPlan] || 0;
            const newLevel = planLevels[plan] || 0;

            if (newLevel > oldLevel) {
              NotificationService.sendToBusinessAdmins(businessId, {
                title: "🚀 Plan Upgraded!",
                message: `Your workspace has successfully been upgraded to the ${plan} plan.`,
                type: "PLAN_UPGRADED",
              });
            } else if (newLevel < oldLevel) {
              NotificationService.sendToBusinessAdmins(businessId, {
                title: "⬇️ Plan Downgraded",
                message: `Your workspace has been downgraded to the ${plan} plan.`,
                type: "PLAN_DOWNGRADED",
              });
            } else {
              NotificationService.sendToBusinessAdmins(businessId, {
                title: "💳 Subscription Renewed",
                message: `Your ${plan} subscription has been successfully renewed.`,
                type: "PLAN_PURCHASED",
              });
            }
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscription = body.payload.subscription.entity;
        const business = await prisma.business.findFirst({
          where: { razorpaySubscriptionId: subscription.id },
        });

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              subscriptionStatus: SubscriptionStatus.CANCELED,
            },
          });

          NotificationService.sendToBusinessAdmins(business.id, {
            title: "⚠️ Subscription Canceled",
            message: `Your subscription has been canceled. Your workspace will revert to the FREE plan at the end of the billing cycle.`,
            type: "PLAN_CANCELED",
          });
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    return { status: "ok" };
  }
}
