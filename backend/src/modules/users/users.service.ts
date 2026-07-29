import { prisma } from '../../utils/prisma';

export class UsersService {
  static async saveFcmToken(userId: string, token: string, deviceType?: string) {
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
        deviceType: deviceType || 'web',
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
      orderBy: { name: 'asc' },
    });
  }
}
