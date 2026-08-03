import jwt from "jsonwebtoken";
import { AuthProvider } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { env } from "../../../config/env";
import { ApiError } from "../../../common/exceptions/apiError";
import { EmailService } from "../../../services/email.service";
import { admin, isFirebaseInitialized } from "../../../config/firebase";
import { TokenService } from "./token.service";

export class PasswordService {
  /**
   * Sync/restore password via Firebase Admin SDK — used when Firebase client-side auth fails
   * but user exists in PostgreSQL (e.g. after provider migration or password reset).
   */
  static async syncPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.notFound(
        "No registered user account found for this email address.",
      );
    }

    let firebaseUid = user.firebaseUid;

    if (isFirebaseInitialized) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email);
        firebaseUid = fbUser.uid;
        await admin.auth().updateUser(fbUser.uid, { password });
        console.log(
          `[Firebase Auth Sync] Successfully restored/synced password for ${email}`,
        );
      } catch (fbErr: any) {
        console.warn("[Firebase Auth Sync Notice]:", fbErr.message);
      }
    }

    // Upgrade to MULTI_PROVIDER if not already (they can now use both methods)
    if (user.authProvider !== AuthProvider.MULTI_PROVIDER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authProvider: AuthProvider.MULTI_PROVIDER, firebaseUid },
      });
    }

    const token = TokenService.generateJwtToken({
      id: user.id,
      firebaseUid,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    const firebaseCustomToken =
      await TokenService.createFirebaseCustomToken(firebaseUid);

    return { user, token, firebaseCustomToken };
  }

  /**
   * Generates reset token and sends a password reset email via EmailService
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.notFound(
        "No registered user account found with this email address.",
      );
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await EmailService.sendPasswordResetEmail(
        user.email,
        user.fullName,
        resetUrl,
      );
    } catch (emailErr: any) {
      throw ApiError.badRequest(
        emailErr.message || "Failed to dispatch password reset email.",
      );
    }

    return {
      message: "Password reset email sent to your email address.",
      resetToken,
      resetUrl,
    };
  }

  /**
   * Resets password using a JWT reset token and updates the user's password in Firebase
   */
  static async resetPassword(token: string, newPassword?: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
      };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw ApiError.notFound("User account not found");

      if (newPassword && isFirebaseInitialized && user.firebaseUid) {
        try {
          await admin
            .auth()
            .updateUser(user.firebaseUid, { password: newPassword });
          console.log(
            `[Firebase Auth] Successfully updated password for user ${user.email}`,
          );
        } catch (fbErr: any) {
          console.warn("[Firebase Auth Password Sync Notice]:", fbErr.message);
        }
      }

      return { message: "Password has been successfully updated." };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest("Invalid or expired password reset token");
    }
  }
}
