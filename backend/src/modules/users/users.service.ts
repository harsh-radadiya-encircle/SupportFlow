import { prisma } from "../../utils/prisma";
import { admin, isFirebaseInitialized } from "../../config/firebase";

export class UsersService {
  static async updateProfile(
    userId: string,
    data: { fullName?: string; phoneNumber?: string },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        avatarUrl: true,
        authProvider: true,
        businessId: true,
        business: true,
      },
    });
  }

  static async saveFcmToken(
    userId: string,
    token: string,
    deviceType?: string,
  ) {
    const existing = await prisma.fcmToken.findUnique({
      where: { token },
    });

    if (existing) {
      return prisma.fcmToken.update({
        where: { token },
        data: { userId, deviceType, updatedAt: new Date() },
      });
    }

    return prisma.fcmToken.create({
      data: {
        userId,
        token,
        deviceType: deviceType || "web",
      },
    });
  }

  static async removeFcmToken(token: string) {
    return prisma.fcmToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Get list of active registered businesses for customer ticket creation selector
   */
  static async getActiveBusinesses() {
    return prisma.business.findMany({
      where: { isSuspended: false },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get all registered platform users (Platform Admin only)
   */
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        fullName: true,
        role: true,
        authProvider: true,
        isActive: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            createdTickets: true,
            assignedTickets: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      firebaseUid: u.firebaseUid,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      authProvider: u.authProvider,
      isActive: u.isActive,
      createdAt: u.createdAt,
      businessName: u.business?.name || "N/A",
      createdTicketsCount: u._count.createdTickets,
      assignedTicketsCount: u._count.assignedTickets,
    }));
  }

  /**
   * Delete User Account from PostgreSQL & Firebase Auth with Cascading Foreign Key Cleanup
   */
  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User account not found.");
    }

    // 1. Delete from Firebase Auth if admin SDK is active
    if (isFirebaseInitialized && user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (fbErr: any) {
        if (fbErr.code === "auth/user-not-found") {
          console.warn(
            "[Firebase Auth Delete] User already deleted from Firebase.",
          );
        } else {
          console.error("[Firebase Auth Delete User Error]:", fbErr.message);
          throw new Error(
            `Failed to delete user from Firebase Auth: ${fbErr.message}`,
          );
        }
      }
    } else {
      console.warn(
        "[Firebase Auth Delete] Skipping Firebase deletion (Firebase not initialized or missing UID).",
      );
    }

    // 2. Perform Cascade Foreign Key Cleanup inside a Prisma Transaction
    return prisma.$transaction(async (tx) => {
      // Unassign user from tickets where assigned as agent
      await tx.ticket.updateMany({
        where: { assignedAgentId: userId },
        data: { assignedAgentId: null },
      });

      // Delete user's notifications & FCM tokens
      await tx.notification.deleteMany({ where: { userId } });
      await tx.fcmToken.deleteMany({ where: { userId } });

      // Delete messages sent by this user
      await tx.message.deleteMany({ where: { senderId: userId } });

      // Delete internal notes authored by this user
      await tx.internalNote.deleteMany({ where: { authorId: userId } });

      // Delete activity logs authored by this user
      await tx.ticketActivity.deleteMany({ where: { actorId: userId } });

      // Delete invitations sent by this user
      await tx.invitation.deleteMany({ where: { invitedById: userId } });

      // Find tickets created by this user as customer and clean up their associated records
      const userTickets = await tx.ticket.findMany({
        where: { customerId: userId },
        select: { id: true },
      });
      const ticketIds = userTickets.map((t) => t.id);

      if (ticketIds.length > 0) {
        await tx.message.deleteMany({ where: { ticketId: { in: ticketIds } } });
        await tx.internalNote.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
        await tx.ticketActivity.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
        await tx.notification.deleteMany({
          where: { ticketId: { in: ticketIds } },
        });
        await tx.ticket.deleteMany({ where: { id: { in: ticketIds } } });
      }

      // Finally, delete the User record
      return tx.user.delete({
        where: { id: userId },
      });
    });
  }
}
