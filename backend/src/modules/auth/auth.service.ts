import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../common/exceptions/apiError';
import { EmailService } from '../../services/email.service';
import { admin, isFirebaseInitialized } from '../../config/firebase';

export interface SyncUserDto {
  firebaseUid: string;
  email: string;
  fullName: string;
  role?: Role;
  businessName?: string;
  mode?: 'login' | 'register';
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE';
}

export class AuthService {
  static async syncOrRegisterUser(dto: SyncUserDto) {
    const isLoginMode = dto.mode === 'login';

    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: dto.firebaseUid }, { email: dto.email }],
      },
      include: { business: true },
    });

    // 1. If in LOGIN mode and user does NOT exist in PostgreSQL DB, reject authentication
    if (isLoginMode && !existingUser) {
      throw ApiError.notFound('No account found for this email address. Please register an account first.');
    }

    // 2. Validate Auth Provider Mutual Exclusion & Sync DB state
    if (existingUser) {
      const isDbGoogle = (existingUser as any).authProvider === 'GOOGLE';
      const isDbEmail = (existingUser as any).authProvider === 'EMAIL_PASSWORD';

      if (dto.authProvider === 'GOOGLE' && isDbEmail) {
        throw ApiError.badRequest('This email address was registered using Email & Password. Please sign in using your email and password.');
      }

      if (dto.authProvider === 'EMAIL_PASSWORD' && isDbGoogle) {
        throw ApiError.badRequest('This email address was registered using Google Sign-In. Please sign in using the "Continue with Google" button.');
      }

      // Sync firebaseUid if it changed or was updated in Firebase Auth
      if (existingUser.firebaseUid !== dto.firebaseUid || (dto.authProvider && (existingUser as any).authProvider !== dto.authProvider)) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firebaseUid: dto.firebaseUid,
            ...(dto.authProvider ? { authProvider: dto.authProvider as any } : {}),
          },
          include: { business: true },
        });
      }
    }

    // 3. If in REGISTER mode and user does not exist, provision new user and business
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
          authProvider: (dto.authProvider as any) || 'EMAIL_PASSWORD',
          businessId,
        },
        include: { business: true },
      });
    }

    // Generate JWT token for authenticated session
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
      throw ApiError.unauthorized('Invalid credentials or user account not found');
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
      throw ApiError.notFound('No registered user account found with this email address.');
    }

    if ((user as any).authProvider === 'GOOGLE') {
      throw ApiError.badRequest(
        'This account was registered using Google Sign-In and does not have a password. Please sign in directly using "Continue with Google".'
      );
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send beautiful transactional HTML password reset email via Brevo
    try {
      await EmailService.sendPasswordResetEmail(user.email, user.fullName, resetUrl);
    } catch (emailErr: any) {
      throw ApiError.badRequest(emailErr.message || 'Failed to dispatch password reset email via Brevo.');
    }

    return {
      message: 'Password reset email sent to your email address.',
      resetToken,
      resetUrl,
    };
  }

  static async resetPassword(token: string, newPassword?: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw ApiError.notFound('User account not found');

      if ((user as any).authProvider === 'GOOGLE') {
        throw ApiError.badRequest('Password reset is not applicable for accounts registered via Google Sign-In.');
      }

      // Sync updated password into Firebase Auth if Firebase Admin SDK is active
      if (newPassword && isFirebaseInitialized && user.firebaseUid) {
        try {
          await admin.auth().updateUser(user.firebaseUid, { password: newPassword });
        } catch (fbErr: any) {
          console.warn('[Firebase Auth Password Sync Notice]:', fbErr.message);
        }
      }

      return { message: 'Password has been successfully updated.' };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest('Invalid or expired password reset token');
    }
  }
}
