import { admin, isFirebaseInitialized } from "../config/firebase";
import { prisma } from "../utils/prisma";
import { emitToUserRoom } from "../socket/socketServer";

export interface SendNotificationOptions {
  userId: string;
  ticketId?: string;
  title: string;
  message: string;
  type?:
    | "NEW_TICKET"
    | "TICKET_ASSIGNED"
    | "NEW_MESSAGE"
    | "STATUS_CHANGED"
    | "TICKET_RESOLVED"
    | "PLAN_PURCHASED"
    | "PLAN_UPGRADED"
    | "PLAN_DOWNGRADED"
    | "PLAN_CANCELED"
    | "PLAN_CHANGED"
    | "PLAN_PAST_DUE"
    | "PLAN_PAYMENT_FAILED"
    | "CSAT_RECEIVED"
    | "URGENT_TICKET"
    | "SYSTEM";
}

export class NotificationService {
  /**
   * Fetch all Business Admins for a specific business and dispatch a notification to each of them.
   */
  static async sendToBusinessAdmins(
    businessId: string,
    options: Omit<SendNotificationOptions, "userId">,
  ) {
    try {
      const admins = await prisma.user.findMany({
        where: { businessId, role: "BUSINESS_ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.sendNotification({
          ...options,
          userId: admin.id,
        });
      }
    } catch (err: any) {
      console.error(
        "[NotificationService sendToBusinessAdmins Error]:",
        err.message,
      );
    }
  }

  /**
   * Create persistent notification in PostgreSQL & dispatch FCM Browser Push Notification + Socket.IO live update
   */
  static async sendNotification({
    userId,
    ticketId,
    title,
    message,
    type = "SYSTEM",
  }: SendNotificationOptions) {
    try {
      // 1. Create persistent Notification record in PostgreSQL via Prisma
      const notification = await prisma.notification.create({
        data: {
          userId,
          ticketId,
          title,
          message,
          type,
        },
      });

      console.log(
        `\n=================== 🔔 NOTIFICATION CREATED 🔔 ===================`,
      );
      console.log(`Target User ID: ${userId}`);
      console.log(`Title: ${title}`);
      console.log(`Message: ${message}`);
      console.log(`Type: ${type}`);
      console.log(
        `==================================================================\n`,
      );

      // 2. Emit Real-Time Socket.IO event to User Room for instant UI update!
      emitToUserRoom(userId, "new_notification", notification);

      // 3. Dispatch Browser Push Notification via Firebase Cloud Messaging (FCM)
      if (isFirebaseInitialized) {
        const tokens = await prisma.fcmToken.findMany({
          where: { userId },
          select: { token: true },
        });

        if (tokens.length > 0) {
          console.log(
            `[FCM Push Notification] Sending push to ${tokens.length} device token(s) for user ${userId}...`,
          );

          for (const t of tokens) {
            try {
              await admin.messaging().send({
                token: t.token,
                notification: {
                  title,
                  body: message,
                },
                data: {
                  ticketId: ticketId || "",
                  type,
                },
              });
              console.log(
                `[FCM Push] Successfully sent to token: ${t.token.substring(0, 10)}...`,
              );
            } catch (fcmErr: any) {
              console.warn("[FCM Push Warning]:", fcmErr.message);
              // Clean up invalid or expired FCM tokens
              if (
                fcmErr.code === "messaging/invalid-registration-token" ||
                fcmErr.code === "messaging/registration-token-not-registered"
              ) {
                await prisma.fcmToken
                  .deleteMany({ where: { token: t.token } })
                  .catch(() => null);
              }
            }
          }
        }
      }

      return notification;
    } catch (err: any) {
      console.error("[NotificationService Error]:", err.message);
      return null;
    }
  }
}
