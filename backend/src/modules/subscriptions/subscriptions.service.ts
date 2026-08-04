import crypto from "crypto";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { razorpay } from "../../config/razorpay";
import { env } from "../../config/env";
import { ApiError } from "../../common/exceptions/apiError";
import { AuthenticatedUser } from "../../common/types";
import { NotificationService } from "../../services/notification.service";
import {
  PLAN_CONFIG,
  getPlanPrice,
  getBillingCycleDays,
  generateInvoiceNumber,
} from "./plans.config";

export class SubscriptionsService {
  // ─────────────────────────────────────────────────────────────────────────
  // GET /subscriptions/current
  // ─────────────────────────────────────────────────────────────────────────

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

    // Auto-Expiry: If billing period ended handle downgrade/cancellation
    if (
      business.currentPeriodEnd &&
      business.currentPeriodEnd < now &&
      business.plan !== SubscriptionPlan.FREE
    ) {
      const targetPlan = business.pendingDowngradePlan ?? SubscriptionPlan.FREE;

      business = await prisma.business.update({
        where: { id: businessId },
        data: {
          plan: targetPlan,
          subscriptionStatus:
            targetPlan === SubscriptionPlan.FREE
              ? SubscriptionStatus.CANCELED
              : SubscriptionStatus.ACTIVE,
          cancelAtPeriodEnd: false,
          pendingDowngradePlan: null,
          currentPeriodEnd: null,
          nextBillingDate: null,
        },
        include: {
          billingHistory: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });

      // Notify business admins of automatic plan change
      await NotificationService.sendToBusinessAdmins(businessId, {
        title: "📅 Plan Automatically Changed",
        message: `Your billing period has ended. Your workspace plan has been changed to ${targetPlan}.`,
        type: "PLAN_CHANGED",
      });
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [agentCount, monthlyTicketCount] = await Promise.all([
      prisma.user.count({
        where: { businessId, role: "SUPPORT_AGENT", isActive: true },
      }),
      prisma.ticket.count({
        where: { businessId, createdAt: { gte: startOfMonth } },
      }),
    ]);

    const planCfg = PLAN_CONFIG[business.plan];
    const maxAgents = planCfg.agents;
    const maxTickets = planCfg.tickets;

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
      billingCycle: business.billingCycle,
      cancelAtPeriodEnd: business.cancelAtPeriodEnd,
      pendingDowngradePlan: business.pendingDowngradePlan,
      currentPeriodEnd: currentPeriodEnd
        ? currentPeriodEnd.toISOString()
        : null,
      nextBillingDate: business.nextBillingDate?.toISOString() ?? null,
      lastPaymentAt: business.lastPaymentAt?.toISOString() ?? null,
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
          max: maxTickets === Infinity ? "Unlimited" : maxTickets,
          percentage:
            maxTickets === Infinity
              ? 0
              : Math.min(
                  100,
                  Math.round((monthlyTicketCount / maxTickets) * 100),
                ),
        },
      },
      billingHistory: business.billingHistory,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /subscriptions/razorpay-order
  // ─────────────────────────────────────────────────────────────────────────

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

    if (!business) throw ApiError.notFound("Business profile not found.");

    const isTestMode =
      !env.RAZORPAY.KEY_ID ||
      env.RAZORPAY.KEY_ID === "rzp_test_mock" ||
      !env.RAZORPAY.KEY_ID.startsWith("rzp_");

    const durationDays = getBillingCycleDays(billingCycle);
    const currentPeriodEnd = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    );

    // ── Test / Development Mode ──────────────────────────────────────────
    if (isTestMode) {
      // In test mode we activate immediately and record a billing entry
      const invoiceCount = await prisma.billingHistory.count({
        where: { businessId: business.id },
      });
      const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);
      const amountPaise = getPlanPrice(plan, billingCycle);

      await prisma.$transaction([
        prisma.business.update({
          where: { id: business.id },
          data: {
            plan: plan as SubscriptionPlan,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            billingCycle,
            cancelAtPeriodEnd: false,
            pendingDowngradePlan: null,
            currentPeriodEnd,
            lastPaymentAt: new Date(),
            nextBillingDate: currentPeriodEnd,
            razorpayOrderId: `test_order_${Date.now()}`,
          },
        }),
        prisma.billingHistory.create({
          data: {
            businessId: business.id,
            invoiceNumber,
            razorpayPaymentId: `test_pay_${Date.now()}`,
            razorpayOrderId: `test_order_${Date.now()}`,
            amountPaid: amountPaise,
            currency: "INR",
            status: "test_captured",
            planAtPayment: plan as SubscriptionPlan,
            billingCycle,
            paymentMethod: "test",
          },
        }),
      ]);

      return {
        isTestMode: true,
        message: `Plan updated to ${plan} (${billingCycle}) in Test Mode. Valid until ${currentPeriodEnd.toLocaleDateString()}.`,
        plan,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      };
    }

    // ── Production: Create Razorpay Order ────────────────────────────────
    const amountInPaise = getPlanPrice(plan, billingCycle);

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
          durationDays: String(durationDays),
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
        err.error?.description ||
          err.message ||
          "Failed to create Razorpay payment order.",
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /subscriptions/verify-payment
  // ─────────────────────────────────────────────────────────────────────────

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

    // Idempotency: skip if already processed
    const existing = await prisma.billingHistory.findUnique({
      where: { razorpayPaymentId: razorpay_payment_id },
    });
    if (existing) {
      return {
        success: true,
        message: "Payment already recorded.",
        plan,
        currentPeriodEnd: (
          await prisma.business.findUnique({ where: { id: user.businessId } })
        )?.currentPeriodEnd?.toISOString(),
      };
    }

    const durationDays = getBillingCycleDays(billingCycle);
    const currentPeriodEnd = new Date(
      Date.now() + durationDays * 24 * 60 * 60 * 1000,
    );
    const amountPaid = getPlanPrice(plan, billingCycle);

    const invoiceCount = await prisma.billingHistory.count({
      where: { businessId: user.businessId },
    });
    const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);

    // Atomic transaction: update business + insert billing history
    await prisma.$transaction([
      prisma.business.update({
        where: { id: user.businessId },
        data: {
          plan: plan as SubscriptionPlan,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          billingCycle,
          cancelAtPeriodEnd: false,
          pendingDowngradePlan: null,
          razorpayOrderId: razorpay_order_id,
          currentPeriodEnd,
          lastPaymentAt: new Date(),
          nextBillingDate: currentPeriodEnd,
        },
      }),
      prisma.billingHistory.upsert({
        where: { razorpayPaymentId: razorpay_payment_id },
        create: {
          businessId: user.businessId,
          invoiceNumber,
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          amountPaid,
          currency: "INR",
          status: "captured",
          planAtPayment: plan as SubscriptionPlan,
          billingCycle,
          paymentMethod: "razorpay",
        },
        update: { status: "captured" },
      }),
    ]);

    await NotificationService.sendToBusinessAdmins(user.businessId, {
      title: "🎉 Payment Successful!",
      message: `Your workspace has been upgraded to the ${PLAN_CONFIG[plan].label}. Valid until ${currentPeriodEnd.toLocaleDateString()}.`,
      type: "PLAN_PURCHASED",
    });

    return {
      success: true,
      message: `Payment verified! ${PLAN_CONFIG[plan].label} activated (${billingCycle}). Valid until ${currentPeriodEnd.toLocaleDateString()}.`,
      plan,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      invoiceNumber,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /subscriptions/cancel  (Schedule downgrade to FREE at period end)
  // ─────────────────────────────────────────────────────────────────────────

  static async cancelSubscription(user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest("No business profile found.");
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) throw ApiError.notFound("Business not found.");

    if (business.plan === SubscriptionPlan.FREE) {
      throw ApiError.badRequest("You are already on the Free plan.");
    }

    // Schedule downgrade to FREE at period end — access stays active until then
    const updated = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        cancelAtPeriodEnd: true,
        pendingDowngradePlan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    await NotificationService.sendToBusinessAdmins(user.businessId, {
      title: "⚠️ Subscription Cancellation Scheduled",
      message: `Your subscription cancellation has been scheduled. You will continue to have access until ${updated.currentPeriodEnd?.toLocaleDateString() ?? "the end of your billing period"}, after which your workspace will revert to the Free plan.`,
      type: "PLAN_CANCELED",
    });

    return {
      success: true,
      message:
        "Subscription cancellation scheduled. Access continues until your current billing period ends, then your workspace reverts to the Free plan.",
      plan: updated.plan,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /subscriptions/downgrade  (Schedule downgrade to a lower paid plan)
  // ─────────────────────────────────────────────────────────────────────────

  static async scheduleDowngrade(
    targetPlan: "STANDARD" | "FREE",
    user: AuthenticatedUser,
  ) {
    if (!user.businessId) {
      throw ApiError.badRequest("No business profile found.");
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) throw ApiError.notFound("Business not found.");

    const planOrder: Record<SubscriptionPlan, number> = {
      FREE: 0,
      STANDARD: 1,
      BUSINESS: 2,
    };

    if (planOrder[targetPlan as SubscriptionPlan] >= planOrder[business.plan]) {
      throw ApiError.badRequest(
        "Target plan must be lower than your current plan. Use the upgrade flow for upgrades.",
      );
    }

    const updated = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        cancelAtPeriodEnd: true,
        pendingDowngradePlan: targetPlan as SubscriptionPlan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    await NotificationService.sendToBusinessAdmins(user.businessId, {
      title: "⬇️ Downgrade Scheduled",
      message: `Your workspace will be downgraded to the ${PLAN_CONFIG[targetPlan as SubscriptionPlan].label} at the end of your current billing period on ${updated.currentPeriodEnd?.toLocaleDateString() ?? "period end"}.`,
      type: "PLAN_DOWNGRADED",
    });

    return {
      success: true,
      message: `Downgrade to ${PLAN_CONFIG[targetPlan as SubscriptionPlan].label} scheduled. Your current plan remains active until ${updated.currentPeriodEnd?.toLocaleDateString() ?? "period end"}.`,
      plan: updated.plan,
      pendingDowngradePlan: updated.pendingDowngradePlan,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST /subscriptions/webhook  (Razorpay Webhooks — idempotent)
  // ─────────────────────────────────────────────────────────────────────────

  static async handleRazorpayWebhook(payloadBuffer: Buffer, signature: string) {
    // 1. Verify HMAC Signature
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY.WEBHOOK_SECRET)
      .update(payloadBuffer)
      .digest("hex");

    if (expectedSignature !== signature) {
      throw ApiError.badRequest(
        "Razorpay Webhook signature verification failed.",
      );
    }

    const body = JSON.parse(payloadBuffer.toString());
    const event: string = body.event;
    const eventId: string = body.id || `${event}_${Date.now()}`;

    console.log(`[Razorpay Webhook]: ${event} (id: ${eventId})`);

    // 2. Idempotency check: skip if already processed
    const alreadyProcessed = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (alreadyProcessed) {
      console.log(`[Razorpay Webhook] Duplicate event ${eventId} — skipping.`);
      return { status: "ok", duplicate: true };
    }

    let businessIdForEvent: string | undefined;

    switch (event) {
      case "order.paid":
      case "payment.captured": {
        const payment = body.payload?.payment?.entity;
        if (!payment) break;

        const notes = payment.notes || {};
        const businessId: string = notes.businessId;
        const plan = notes.plan as SubscriptionPlan;
        const billingCycle: "monthly" | "yearly" =
          (notes.billingCycle as "monthly" | "yearly") || "monthly";
        const razorpayPaymentId: string = payment.id;
        const razorpayOrderId: string = payment.order_id;
        const amountPaid: number = payment.amount;

        businessIdForEvent = businessId;

        if (!businessId || !plan || !PLAN_CONFIG[plan]) break;

        const business = await prisma.business.findUnique({
          where: { id: businessId },
        });

        if (!business) break;

        // Idempotency on billing entry
        const existingBilling = await prisma.billingHistory.findUnique({
          where: { razorpayPaymentId },
        });

        const durationDays = getBillingCycleDays(billingCycle);
        const currentPeriodEnd = new Date(
          Date.now() + durationDays * 24 * 60 * 60 * 1000,
        );

        const invoiceCount = await prisma.billingHistory.count({
          where: { businessId },
        });
        const invoiceNumber =
          existingBilling?.invoiceNumber ??
          generateInvoiceNumber(invoiceCount + 1);

        const oldPlan = business.plan;

        await prisma.$transaction([
          prisma.business.update({
            where: { id: businessId },
            data: {
              plan,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
              billingCycle,
              cancelAtPeriodEnd: false,
              pendingDowngradePlan: null,
              currentPeriodEnd,
              lastPaymentAt: new Date(),
              nextBillingDate: currentPeriodEnd,
              razorpayOrderId,
            },
          }),
          prisma.billingHistory.upsert({
            where: { razorpayPaymentId },
            create: {
              businessId,
              invoiceNumber,
              razorpayPaymentId,
              razorpayOrderId,
              amountPaid,
              currency: payment.currency || "INR",
              status: "captured",
              planAtPayment: plan,
              billingCycle,
              paymentMethod: payment.method ?? "razorpay",
            },
            update: { status: "captured" },
          }),
        ]);

        const planOrder: Record<SubscriptionPlan, number> = {
          FREE: 0,
          STANDARD: 1,
          BUSINESS: 2,
        };
        const oldLevel = planOrder[oldPlan] ?? 0;
        const newLevel = planOrder[plan] ?? 0;

        if (newLevel > oldLevel) {
          await NotificationService.sendToBusinessAdmins(businessId, {
            title: "🚀 Plan Upgraded!",
            message: `Your workspace has been upgraded to the ${PLAN_CONFIG[plan].label}.`,
            type: "PLAN_UPGRADED",
          });
        } else {
          await NotificationService.sendToBusinessAdmins(businessId, {
            title: "💳 Subscription Renewed",
            message: `Your ${PLAN_CONFIG[plan].label} subscription has been successfully renewed. Valid until ${currentPeriodEnd.toLocaleDateString()}.`,
            type: "PLAN_PURCHASED",
          });
        }

        break;
      }

      case "payment.failed": {
        const payment = body.payload?.payment?.entity;
        if (!payment) break;

        const notes = payment.notes || {};
        const businessId: string = notes.businessId;
        businessIdForEvent = businessId;

        if (!businessId) break;

        const razorpayPaymentId: string = payment.id;

        await prisma.billingHistory.upsert({
          where: { razorpayPaymentId },
          create: {
            businessId,
            razorpayPaymentId,
            razorpayOrderId: payment.order_id,
            amountPaid: payment.amount || 0,
            currency: payment.currency || "INR",
            status: "failed",
            planAtPayment: notes.plan as SubscriptionPlan,
            billingCycle: notes.billingCycle,
            paymentMethod: payment.method ?? "razorpay",
          },
          update: { status: "failed" },
        });

        await NotificationService.sendToBusinessAdmins(businessId, {
          title: "❌ Payment Failed",
          message:
            "Your recent payment attempt failed. Please check your payment details and try again from the Billing page.",
          type: "PLAN_PAYMENT_FAILED",
        });

        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subscription = body.payload?.subscription?.entity;
        if (!subscription) break;

        const business = await prisma.business.findFirst({
          where: { razorpaySubscriptionId: subscription.id },
        });

        if (!business) break;
        businessIdForEvent = business.id;

        await prisma.business.update({
          where: { id: business.id },
          data: {
            cancelAtPeriodEnd: true,
            pendingDowngradePlan: SubscriptionPlan.FREE,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });

        await NotificationService.sendToBusinessAdmins(business.id, {
          title: "⚠️ Subscription Canceled",
          message:
            "Your subscription has been canceled. Access continues until your current billing period ends.",
          type: "PLAN_CANCELED",
        });

        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    // 3. Record the processed event for idempotency
    await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType: event,
        businessId: businessIdForEvent,
        payload: body,
      },
    });

    return { status: "ok" };
  }
}
