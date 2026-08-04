import cron from "node-cron";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { NotificationService } from "../services/notification.service";

/**
 * Subscription Expiry Cron Job
 *
 * Runs every hour. Finds all businesses whose billing period has ended
 * and applies the scheduled downgrade or free plan reversion.
 *
 * This handles the case where a user never triggers getSubscriptionDetails
 * (i.e., they don't visit the app before their period expires).
 */
export function startSubscriptionExpiryJob(): void {
  // Runs every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("[SubscriptionExpiry] Running expiry check...");

    try {
      const now = new Date();

      // Find all non-FREE businesses whose billing period has ended
      const expiredBusinesses = await prisma.business.findMany({
        where: {
          plan: { not: SubscriptionPlan.FREE },
          currentPeriodEnd: { lt: now },
        },
        select: {
          id: true,
          plan: true,
          cancelAtPeriodEnd: true,
          pendingDowngradePlan: true,
          currentPeriodEnd: true,
        },
      });

      if (expiredBusinesses.length === 0) {
        console.log("[SubscriptionExpiry] No expired subscriptions found.");
        return;
      }

      console.log(
        `[SubscriptionExpiry] Found ${expiredBusinesses.length} expired subscription(s).`,
      );

      for (const business of expiredBusinesses) {
        try {
          if (business.cancelAtPeriodEnd) {
            // Downgrade to the pending plan (FREE or STANDARD)
            const targetPlan =
              business.pendingDowngradePlan ?? SubscriptionPlan.FREE;

            await prisma.business.update({
              where: { id: business.id },
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
            });

            console.log(
              `[SubscriptionExpiry] Business ${business.id}: downgraded from ${business.plan} → ${targetPlan}`,
            );

            await NotificationService.sendToBusinessAdmins(business.id, {
              title: "📅 Plan Changed",
              message: `Your ${business.plan} billing period has ended. Your workspace has been moved to the ${targetPlan} plan as scheduled.`,
              type: "PLAN_CHANGED",
            });
          } else {
            // Period ended but not explicitly cancelled — mark as PAST_DUE
            // (grace period: user may renew manually)
            await prisma.business.update({
              where: { id: business.id },
              data: {
                subscriptionStatus: SubscriptionStatus.PAST_DUE,
              },
            });

            console.log(
              `[SubscriptionExpiry] Business ${business.id}: marked PAST_DUE (plan: ${business.plan})`,
            );

            await NotificationService.sendToBusinessAdmins(business.id, {
              title: "⚠️ Subscription Past Due",
              message: `Your ${business.plan} subscription has expired. Please renew your plan from the Billing page to continue using premium features.`,
              type: "PLAN_PAST_DUE",
            });
          }
        } catch (err) {
          console.error(
            `[SubscriptionExpiry] Failed to process business ${business.id}:`,
            err,
          );
        }
      }
    } catch (err) {
      console.error("[SubscriptionExpiry] Cron job error:", err);
    }
  });

  console.log("[SubscriptionExpiry] Cron job registered (runs every hour).");
}
