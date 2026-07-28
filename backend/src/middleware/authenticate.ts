import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { admin, isFirebaseInitialized } from '../config/firebase';
import { env } from '../config/env';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../common/types';
import { ApiError } from '../common/exceptions/apiError';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    let decodedEmail: string | null = null;
    let decodedUid: string | null = null;

    // 1. Attempt Firebase ID Token verification
    if (isFirebaseInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        decodedUid = decodedToken.uid;
        decodedEmail = decodedToken.email || null;
      } catch (err) {
        // Fallback to custom JWT if Firebase token fails
      }
    }

    // 2. Fallback to custom JWT verification if Firebase decode was unfulfilled
    if (!decodedEmail && !decodedUid) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as { uid: string; email: string };
        decodedUid = payload.uid;
        decodedEmail = payload.email;
      } catch (jwtErr) {
        throw ApiError.unauthorized('Invalid or expired authentication token');
      }
    }

    // 3. Lookup User in Database via firebaseUid or email
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(decodedUid ? [{ firebaseUid: decodedUid }] : []),
          ...(decodedEmail ? [{ email: decodedEmail }] : []),
        ],
      },
      include: {
        business: true,
      },
    });

    if (!dbUser) {
      throw ApiError.unauthorized('User account not found in system database');
    }

    if (!dbUser.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    if (dbUser.business?.isSuspended) {
      throw ApiError.forbidden('Your business account has been suspended by system administrator.');
    }

    req.user = {
      id: dbUser.id,
      firebaseUid: dbUser.firebaseUid,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
      businessId: dbUser.businessId,
      business: dbUser.business,
    };

    next();
  } catch (error) {
    next(error);
  }
};
