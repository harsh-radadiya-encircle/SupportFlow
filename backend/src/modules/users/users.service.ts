import { prisma } from "../../utils/prisma";
import { admin, isFirebaseInitialized } from "../../config/firebase";

export class UsersService {
  static async updateProfile(
    userId: string,
    data: { fullName?: string; phoneNumber?: string; businessName?: string },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, businessId: true },
    });

    if (
      data.businessName &&
      user?.role === "BUSINESS_ADMIN" &&
      user.businessId
    ) {
      await prisma.business.update({
        where: { id: user.businessId },
        data: { name: data.businessName },
      });
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
      },
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

    const isBusinessAdmin = user.role === "BUSINESS_ADMIN" && user.businessId;

    // Collect all user IDs and firebase UIDs to delete
    const userIdsToDelete = [userId];
    const firebaseUidsToDelete = user.firebaseUid ? [user.firebaseUid] : [];

    // 1. Perform Cascade Foreign Key Cleanup inside a Prisma Transaction FIRST
    const deletedUser = await prisma.$transaction(async (tx) => {
      if (isBusinessAdmin && user.businessId) {
        // Find other users associated with this business (e.g. agents)
        const otherUsers = await tx.user.findMany({
          where: { businessId: user.businessId, id: { not: userId } },
          select: { id: true, firebaseUid: true },
        });

        for (const ou of otherUsers) {
          userIdsToDelete.push(ou.id);
          if (ou.firebaseUid) {
            firebaseUidsToDelete.push(ou.firebaseUid);
          }
        }
      }

      // Unassign all users we are deleting from tickets where they are assigned as agent
      await tx.ticket.updateMany({
        where: { assignedAgentId: { in: userIdsToDelete } },
        data: { assignedAgentId: null },
      });

      // Delete notifications & FCM tokens
      await tx.fcmToken.deleteMany({
        where: { userId: { in: userIdsToDelete } },
      });
      await tx.notification.deleteMany({
        where: { userId: { in: userIdsToDelete } },
      });

      // Delete messages sent by these users
      await tx.message.deleteMany({
        where: { senderId: { in: userIdsToDelete } },
      });

      // Delete internal notes authored by these users
      await tx.internalNote.deleteMany({
        where: { authorId: { in: userIdsToDelete } },
      });

      // Delete activity logs authored by these users
      await tx.ticketActivity.deleteMany({
        where: { actorId: { in: userIdsToDelete } },
      });

      // Delete invitations sent by these users
      await tx.invitation.deleteMany({
        where: { invitedById: { in: userIdsToDelete } },
      });

      // Find tickets created by these users as customers and clean up their associated records
      const userTickets = await tx.ticket.findMany({
        where: { customerId: { in: userIdsToDelete } },
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

      // If the user was a BUSINESS_ADMIN, delete their associated business
      if (isBusinessAdmin && user.businessId) {
        // Deleting the business cascades to tickets, invitations, billingHistory
        await tx.business.delete({
          where: { id: user.businessId },
        });
      }

      // Finally, delete the User records
      await tx.user.deleteMany({
        where: { id: { in: userIdsToDelete } },
      });

      return user;
    });

    // 2. Delete from Firebase Auth only AFTER the Postgres transaction succeeds
    if (isFirebaseInitialized && firebaseUidsToDelete.length > 0) {
      try {
        // Revoke refresh tokens first for all users
        for (const fUid of firebaseUidsToDelete) {
          await admin
            .auth()
            .revokeRefreshTokens(fUid)
            .catch((err) => {
              console.error(
                `[Firebase Auth Revoke Error for ${fUid}]:`,
                err.message,
              );
            });
        }

        // Delete users in batch from Firebase
        await admin.auth().deleteUsers(firebaseUidsToDelete);
      } catch (fbErr: any) {
        console.error("[Firebase Auth Delete Users Error]:", fbErr.message);
      }
    }

    return deletedUser;
  }
}
