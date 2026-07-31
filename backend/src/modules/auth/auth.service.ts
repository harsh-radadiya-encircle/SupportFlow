import { Role, AuthProvider } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../common/exceptions/apiError";
import { EmailService } from "../../services/email.service";
import { admin, isFirebaseInitialized } from "../../config/firebase";

export interface SyncUserDto {
  firebaseUid: string;
  email: string;
  fullName?: string;
  role?: Role;
  businessName?: string;
  mode?: "login" | "register";
  authProvider?: "EMAIL_PASSWORD" | "GOOGLE" | "MULTI_PROVIDER";
}

export class AuthService {
  /**
   * Check which auth provider a user registered with (by email)
   */
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

  /**
   * Core auth sync — creates or updates user in PostgreSQL after Firebase auth succeeds.
   *
   * Provider rules:
   *   - EMAIL_PASSWORD user tries Google login  → reject (must link from Profile)
   *   - GOOGLE user tries email/password login  → allow (treated as MULTI_PROVIDER)
   *   - MULTI_PROVIDER user tries any method    → always allow
   *   - New user via Google                     → auto-provision as GOOGLE
   *   - New user via email/password register    → provision as EMAIL_PASSWORD
   */
  static async syncOrRegisterUser(dto: SyncUserDto) {
    const isLoginMode = dto.mode === "login";
    const isRegisterMode = dto.mode === "register";
    const incomingProvider = dto.authProvider as AuthProvider | undefined;

    // Find existing user by firebaseUid first, then fall back to email
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid: dto.firebaseUid }, { email: dto.email }],
      },
      include: { business: true },
    });

    // ── REGISTER MODE ──────────────────────────────────────────────────────────
    if (isRegisterMode && existingUser) {
      throw ApiError.badRequest(
        "An account with this email already exists. Please sign in using Email & Password or Google.",
      );
    }

    // ── LOGIN MODE ─────────────────────────────────────────────────────────────
    if (isLoginMode && existingUser) {
      const storedProvider = existingUser.authProvider as string;
      const updateData: Record<string, unknown> = {};

      // ── MULTI_PROVIDER upgrade (from Profile "Connect Google Account" button) ──
      // When the user explicitly connects Google from their profile, we trust the
      // new Google UID and upgrade their account to MULTI_PROVIDER.
      if (incomingProvider === "MULTI_PROVIDER") {
        updateData.authProvider = AuthProvider.MULTI_PROVIDER;
        if (dto.firebaseUid && dto.firebaseUid !== "check") {
          // Store the Google UID alongside the account so either provider UID
          // can be used to look up the user in future requests.
          updateData.firebaseUid = dto.firebaseUid;
        }
      }

      // Block: pure EMAIL_PASSWORD account attempting a direct Google login from Login page.
      // (Frontend should catch this first, but backend enforces it as a safety net.)
      if (
        storedProvider === "EMAIL_PASSWORD" &&
        incomingProvider === "GOOGLE" &&
        existingUser.firebaseUid !== dto.firebaseUid
      ) {
        throw ApiError.badRequest(
          "This email is registered with Email & Password. Please sign in with your password. You can link Google in Profile > Connected Accounts after signing in.",
        );
      }

      // Sync firebaseUid if it has legitimately changed (e.g. same provider, different device)
      if (
        incomingProvider !== "MULTI_PROVIDER" && // Already handled above
        dto.firebaseUid &&
        dto.firebaseUid !== "check" &&
        existingUser.firebaseUid !== dto.firebaseUid &&
        (storedProvider === "MULTI_PROVIDER" ||
          storedProvider === (incomingProvider as string))
      ) {
        updateData.firebaseUid = dto.firebaseUid;
      }

      // Upgrade to MULTI_PROVIDER when a GOOGLE-registered user now also uses email/password
      if (
        storedProvider === "GOOGLE" &&
        incomingProvider === "EMAIL_PASSWORD"
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

    // ── LOGIN with no existing user (Google auto-provision) ────────────────────
    if (isLoginMode && !existingUser && incomingProvider === "GOOGLE") {
      // Auto-register new Google users on first login
      let businessId: string | undefined;

      if (dto.role === Role.BUSINESS_ADMIN && dto.businessName) {
        const slug =
          dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-") +
          "-" +
          Date.now();
        const business = await prisma.business.create({
          data: { name: dto.businessName, slug },
        });
        businessId = business.id;
      }

      existingUser = await prisma.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          email: dto.email,
          fullName: dto.fullName || "Google User",
          role: dto.role || Role.CUSTOMER,
          authProvider: AuthProvider.GOOGLE,
          businessId,
        },
        include: { business: true },
      });
    }

    // ── LOGIN with no existing user (non-Google) ───────────────────────────────
    if (isLoginMode && !existingUser) {
      // Self-heal desync: if the user exists in Firebase but not in Postgres, auto-create them.
      let role: Role = dto.role || Role.CUSTOMER;
      let businessId: string | undefined;

      // Check if they have an active pending invitation
      const invitation = await prisma.invitation.findFirst({
        where: { email: dto.email, isAccepted: false },
      });

      if (invitation) {
        role = invitation.role;
        businessId = invitation.businessId;
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { isAccepted: true },
        });
      }

      existingUser = await prisma.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          email: dto.email,
          fullName: dto.fullName || dto.email.split("@")[0] || "User",
          role,
          authProvider:
            (incomingProvider as AuthProvider) || AuthProvider.EMAIL_PASSWORD,
          businessId,
        },
        include: { business: true },
      });
    }

    // ── REGISTER (new user provision) ──────────────────────────────────────────
    if (!existingUser) {
      let businessId: string | undefined;

      if (dto.role === Role.BUSINESS_ADMIN && dto.businessName) {
        const slug =
          dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, "-") +
          "-" +
          Date.now();
        const business = await prisma.business.create({
          data: { name: dto.businessName, slug },
        });
        businessId = business.id;
      }

      existingUser = await prisma.user.create({
        data: {
          firebaseUid: dto.firebaseUid,
          email: dto.email,
          fullName: dto.fullName || "User",
          role: dto.role || Role.CUSTOMER,
          authProvider:
            (incomingProvider as AuthProvider) || AuthProvider.EMAIL_PASSWORD,
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
      { expiresIn: "7d" },
    );

    const firebaseCustomToken = await this.createFirebaseCustomToken(
      existingUser.firebaseUid,
    );

    return { user: existingUser, token, firebaseCustomToken };
  }

  static async createFirebaseCustomToken(
    firebaseUid: string,
  ): Promise<string | undefined> {
    if (isFirebaseInitialized && firebaseUid && firebaseUid !== "check") {
      try {
        return await admin.auth().createCustomToken(firebaseUid);
      } catch (err: any) {
        console.warn("[Firebase Custom Token Notice]:", err.message);
      }
    }
    return undefined;
  }

  static async getCustomToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.notFound("User not found");
    const firebaseCustomToken = await this.createFirebaseCustomToken(
      user.firebaseUid,
    );
    return { firebaseCustomToken };
  }

  static async login(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw ApiError.unauthorized(
        "Invalid credentials or user account not found",
      );
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
      { expiresIn: "7d" },
    );

    const firebaseCustomToken = await this.createFirebaseCustomToken(
      user.firebaseUid,
    );

    return { user, token, firebaseCustomToken };
  }

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

    const token = jwt.sign(
      {
        id: user.id,
        uid: firebaseUid,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const firebaseCustomToken =
      await this.createFirebaseCustomToken(firebaseUid);

    return { user, token, firebaseCustomToken };
  }

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
