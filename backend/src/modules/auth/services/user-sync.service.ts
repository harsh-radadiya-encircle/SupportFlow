import { Role, AuthProvider } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { ApiError } from "../../../common/exceptions/apiError";
import { TokenService } from "./token.service";

export interface SyncUserDto {
  firebaseUid: string;
  email: string;
  fullName?: string;
  role?: Role;
  businessName?: string;
  mode?: "login" | "register";
  authProvider?: "EMAIL_PASSWORD" | "GOOGLE" | "MULTI_PROVIDER";
}

export class UserSyncService {
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
      if (incomingProvider === "MULTI_PROVIDER") {
        updateData.authProvider = AuthProvider.MULTI_PROVIDER;
        if (dto.firebaseUid && dto.firebaseUid !== "check") {
          updateData.firebaseUid = dto.firebaseUid;
        }
      }

      // Block: pure EMAIL_PASSWORD account attempting a direct Google login from Login page.
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
        incomingProvider !== "MULTI_PROVIDER" &&
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

    const token = TokenService.generateJwtToken({
      id: existingUser.id,
      firebaseUid: existingUser.firebaseUid,
      email: existingUser.email,
      role: existingUser.role,
      businessId: existingUser.businessId,
    });

    const firebaseCustomToken = await TokenService.createFirebaseCustomToken(
      existingUser.firebaseUid,
    );

    return { user: existingUser, token, firebaseCustomToken };
  }

  /**
   * Log in user locally using email (once Firebase auth has checked/passed on frontend)
   */
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

    const token = TokenService.generateJwtToken({
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    });

    const firebaseCustomToken = await TokenService.createFirebaseCustomToken(
      user.firebaseUid,
    );

    return { user, token, firebaseCustomToken };
  }
}
