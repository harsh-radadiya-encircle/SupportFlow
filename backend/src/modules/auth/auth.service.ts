import { Role, AuthProvider } from '@prisma/client';
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
  authProvider?: 'EMAIL_PASSWORD' | 'GOOGLE' | 'MULTI_PROVIDER';
}

export class AuthService {
  static async checkProvider(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        authProvider: true,
      },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      authProvider: user.authProvider,
    };
  }

  static async syncOrRegisterUser(dto: SyncUserDto) {
    const isLoginMode = dto.mode === 'login';
    const isRegisterMode = dto.mode === 'register';

    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { firebaseUid: dto.firebaseUid }],
      },
      include: { business: true },
    });

    // 1. If in REGISTER mode and user ALREADY exists in PostgreSQL DB, reject duplicate registration attempt
    if (isRegisterMode && existingUser) {
      throw ApiError.badRequest(
        'An account with this email address already exists. Please sign in directly using Email & Password or Google.'
      );
    }

    // 2. If in LOGIN mode and user does NOT exist in PostgreSQL DB
    if (isLoginMode && !existingUser && dto.authProvider !== 'GOOGLE') {
      throw ApiError.notFound('No account found for this email address. Please click "Create account" below to sign up first.');
    }

    // 3. Multi-Provider Seamless Synchronization for existing users
    if (existingUser) {
      const updateData: any = {};

      // Keep firebaseUid in sync if updated in Firebase Auth
      if (existingUser.firebaseUid !== dto.firebaseUid && dto.firebaseUid !== 'check') {
        updateData.firebaseUid = dto.firebaseUid;
      }

      // If user logs in with a different provider than originally registered, store MULTI_PROVIDER
      if (
        dto.authProvider &&
        (existingUser.authProvider as string) !== 'MULTI_PROVIDER' &&
        existingUser.authProvider !== (dto.authProvider as AuthProvider)
      ) {
        updateData.authProvider = AuthProvider.MULTI_PROVIDER;
      }

      if (Object.keys(updateData).length > 0) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
          include: { business: true },
        });
      }
    }

    // 4. Provision new user if not existing
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
          authProvider: (dto.authProvider as AuthProvider) || AuthProvider.EMAIL_PASSWORD,
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

    const firebaseCustomToken = await this.createFirebaseCustomToken(existingUser.firebaseUid);

    return { user: existingUser, token, firebaseCustomToken };
  }

  static async createFirebaseCustomToken(firebaseUid: string): Promise<string | undefined> {
    if (isFirebaseInitialized && firebaseUid && firebaseUid !== 'check') {
      try {
        return await admin.auth().createCustomToken(firebaseUid);
      } catch (err: any) {
        console.warn('[Firebase Custom Token Notice]:', err.message);
      }
    }
    return undefined;
  }

  static async getCustomToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.notFound('User not found');
    const firebaseCustomToken = await this.createFirebaseCustomToken(user.firebaseUid);
    return { firebaseCustomToken };
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

    const firebaseCustomToken = await this.createFirebaseCustomToken(user.firebaseUid);

    return { user, token, firebaseCustomToken };
  }

  static async syncPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.notFound('No registered user account found for this email address.');
    }

    let firebaseUid = user.firebaseUid;

    if (isFirebaseInitialized) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email);
        firebaseUid = fbUser.uid;
        await admin.auth().updateUser(fbUser.uid, { password });
        console.log(`[Firebase Auth Sync] Successfully restored/synced password for ${email}`);
      } catch (fbErr: any) {
        console.warn('[Firebase Auth Sync Notice]:', fbErr.message);
      }
    }

    if (user.authProvider !== AuthProvider.MULTI_PROVIDER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authProvider: AuthProvider.MULTI_PROVIDER, firebaseUid },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        uid: firebaseUid,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const firebaseCustomToken = await this.createFirebaseCustomToken(firebaseUid);

    return { user, token, firebaseCustomToken };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.notFound('No registered user account found with this email address.');
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '15m' });
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send transactional HTML password reset email via Brevo
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

      // Update password in Firebase Auth via Firebase Admin SDK if active
      if (newPassword && isFirebaseInitialized && user.firebaseUid) {
        try {
          await admin.auth().updateUser(user.firebaseUid, { password: newPassword });
          console.log(`[Firebase Auth] Successfully updated password for user ${user.email}`);
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
