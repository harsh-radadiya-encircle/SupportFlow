import { admin, isFirebaseInitialized } from '../../config/firebase';
import { prisma } from '../../utils/prisma';

export interface SendPushNotificationPayload {
  userId: string;
  ticketId?: string;
  title: string;
  body: string;
  type: string;
}

export class NotificationService {
  static async sendPushNotification(payload: SendPushNotificationPayload) {
    // 1. Save Notification record in PostgreSQL
    const dbNotification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        ticketId: payload.ticketId,
        title: payload.title,
        message: payload.body,
        type: payload.type,
      },
    });

    // 2. Fetch active FCM tokens for the user from PostgreSQL
    const fcmTokens = await prisma.fcmToken.findMany({
      where: { userId: payload.userId },
    });

    if (fcmTokens.length === 0 || !isFirebaseInitialized) {
      return dbNotification;
    }

    // 3. Dispatch FCM Push Notifications via Firebase Admin SDK
    for (const fcmRecord of fcmTokens) {
      try {
        await admin.messaging().send({
          token: fcmRecord.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            ticketId: payload.ticketId || '',
            type: payload.type,
          },
        });
      } catch (err: any) {
        console.warn(`[FCM Push] Failed to send push to token ${fcmRecord.token}:`, err.message);
        // Clean up invalid / unregistered tokens automatically
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        ) {
          await prisma.fcmToken.delete({ where: { id: fcmRecord.id } }).catch(() => null);
        }
      }
    }

    return dbNotification;
  }
}
