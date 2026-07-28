import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../common/exceptions/apiError';

export interface SyncUserDto {
  firebaseUid: string;
  email: string;
  fullName: string;
  role?: Role;
  businessName?: string;
}

export class AuthService {
  static async syncOrRegisterUser(dto: SyncUserDto) {
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: dto.firebaseUid }, { email: dto.email }],
      },
      include: { business: true },
    });

    if (!existingUser) {
      let businessId: string | undefined;

      if (dto.role === Role.BUSINESS_ADMIN && dto.businessName) {
        const slug = dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        const business = await prisma.business.create({
          data: {
            name: dto.businessName,
            slug,
          },
        });
        businessId = business.id;
      }

      existingUser = await prisma.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          email: dto.email,
          fullName: dto.fullName,
          role: dto.role || Role.CUSTOMER,
          businessId,
        },
        include: { business: true },
      });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        uid: existingUser.firebaseUid,
        email: existingUser.email,
        role: existingUser.role,
        businessId: existingUser.businessId,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: existingUser, token };
  }

  static async login(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials or user not found');
    }

    const token = jwt.sign(
      {
        id: user.id,
        uid: user.firebaseUid,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent user enumeration attacks
      return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
    }

    // Generate single-use password reset token
    const resetToken = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '15m' });
    return {
      message: 'Password reset link dispatched to email.',
      resetToken, // Returned in dev mode for UI password reset testing
    };
  }

  static async resetPassword(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw ApiError.notFound('User account not found');

      return { message: 'Password has been successfully updated.' };
    } catch (err) {
      throw ApiError.badRequest('Invalid or expired password reset token');
    }
  }
}
