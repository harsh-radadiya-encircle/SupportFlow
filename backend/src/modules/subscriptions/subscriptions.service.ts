import Stripe from 'stripe';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { stripe } from '../../config/stripe';
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
          role: { in: ['SUPPORT_AGENT', 'BUSINESS_ADMIN'] },
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
      stripeCustomerId: business.stripeCustomerId,
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
   * Create Stripe Checkout Session for Plan Upgrades
   */
  static async createCheckoutSession(plan: 'STANDARD' | 'BUSINESS', user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest('You must be associated with a business to upgrade plans.');
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business) {
      throw ApiError.notFound('Business profile not found.');
    }

    // Get or Create Stripe Customer ID
    let customerId = business.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: business.name,
        metadata: {
          businessId: business.id,
        },
      });

      customerId = customer.id;

      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Determine Monthly Amount ($29 for Standard, $79 for Business)
    const unitAmount = plan === 'STANDARD' ? 2900 : 7900;
    const planName = plan === 'STANDARD' ? 'SupportFlow Standard Plan' : 'SupportFlow Business Plan';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description:
                plan === 'STANDARD'
                  ? 'Includes up to 5 Support Agents & Unlimited Tickets'
                  : 'Includes up to 20 Support Agents, Analytics & Priority Support',
            },
            unit_amount: unitAmount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${env.FRONTEND_URL}/business/billing?success=true&plan=${plan}`,
      cancel_url: `${env.FRONTEND_URL}/business/billing?canceled=true`,
      metadata: {
        businessId: business.id,
        plan,
      },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Create Stripe Customer Billing Portal Session
   */
  static async createBillingPortalSession(user: AuthenticatedUser) {
    if (!user.businessId) {
      throw ApiError.badRequest('No business profile found.');
    }

    const business = await prisma.business.findUnique({
      where: { id: user.businessId },
    });

    if (!business || !business.stripeCustomerId) {
      throw ApiError.badRequest('No active Stripe customer billing profile found for this business.');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/business/billing`,
    });

    return { portalUrl: session.url };
  }

  /**
   * Process Verified Stripe Webhook Signature Events
   */
  static async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = env.STRIPE.WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook Signature Verification Failed]:', err.message);
      throw ApiError.badRequest(`Webhook Signature Verification Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook Received]: Event type ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const businessId = session.metadata?.businessId;
        const plan = session.metadata?.plan as SubscriptionPlan;

        if (businessId && plan) {
          await prisma.business.update({
            where: { id: businessId },
            data: {
              plan,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: SubscriptionStatus.ACTIVE,
            },
          });
          console.log(`[Stripe Webhook] Business ${businessId} upgraded to ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const business = await prisma.business.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (business) {
          const status =
            subscription.status === 'active'
              ? SubscriptionStatus.ACTIVE
              : subscription.status === 'past_due'
              ? SubscriptionStatus.PAST_DUE
              : SubscriptionStatus.CANCELED;

          await prisma.business.update({
            where: { id: business.id },
            data: {
              subscriptionStatus: status,
              currentPeriodEnd: (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000)
                : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const business = await prisma.business.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: {
              plan: SubscriptionPlan.FREE,
              subscriptionStatus: SubscriptionStatus.CANCELED,
            },
          });
          console.log(`[Stripe Webhook] Subscription canceled for Business ${business.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const business = await prisma.business.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (business && invoice.id) {
          await prisma.billingHistory.create({
            data: {
              businessId: business.id,
              stripeInvoiceId: invoice.id,
              amountPaid: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status || 'paid',
              pdfUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
            },
          }).catch(() => null); // Prevent duplicate invoice crash if re-sent
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
