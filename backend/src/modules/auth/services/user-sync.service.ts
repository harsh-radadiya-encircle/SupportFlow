import { Role, AuthProvider } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { ApiError } from "../../../common/exceptions/apiError";
import { admin } from "../../../config/firebase";

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

    // Find existing user strictly by unique firebaseUid first
    let existingUser = await prisma.user.findUnique({
      where: { firebaseUid: dto.firebaseUid },
      include: { business: true },
    });

    // Fall back to matching by unique email if UID query yields nothing
    if (!existingUser && dto.email) {
      existingUser = await prisma.user.findUnique({
        where: { email: dto.email },
        include: { business: true },
      });
    }

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

      // Block: pure GOOGLE account attempting a direct Email/Password login from Login page.
      if (
        storedProvider === "GOOGLE" &&
        incomingProvider === "EMAIL_PASSWORD" &&
        existingUser.firebaseUid !== dto.firebaseUid
      ) {
        throw ApiError.badRequest(
          "This email is registered with Google. Please sign in with Google. You can link Email & Password in Profile > Connected Accounts after signing in.",
        );
      }

      if (Object.keys(updateData).length > 0) {
        existingUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
          include: { business: true },
        });
      }
    }

    // ── CREATE NEW USER (Registration / Auto-provision / Self-healing) ──
    if (!existingUser) {
      // Resolve any pending invitations matching email
      const invitation = await prisma.invitation.findFirst({
        where: { email: dto.email, isAccepted: false },
      });

      let role: Role = Role.CUSTOMER;
      let businessId: string | null = null;

      if (invitation) {
        role = invitation.role;
        businessId = invitation.businessId;
      } else {
        // Direct self-registration: Strictly validate requested role to prevent privilege escalation
        role = dto.role || Role.CUSTOMER;
        const allowedSelfRegRoles: Role[] = [
          Role.CUSTOMER,
          Role.BUSINESS_ADMIN,
        ];
        if (!allowedSelfRegRoles.includes(role)) {
          throw ApiError.badRequest(
            `Self-registration is not permitted for the role: ${role}`,
          );
        }
      }

      existingUser = await prisma.$transaction(async (tx) => {
        // If invitation exists, mark it as consumed
        if (invitation) {
          await tx.invitation.update({
            where: { id: invitation.id },
            data: { isAccepted: true },
          });
        } else if (role === Role.BUSINESS_ADMIN) {
          // Self-registering business admin: create the business
          const finalBusinessName =
            dto.businessName ||
            `${dto.fullName || dto.email.split("@")[0] || "User"}'s Business`;
          const slug =
            finalBusinessName.toLowerCase().replace(/[^a-z0-9]/g, "-") +
            "-" +
            Date.now();
          const business = await tx.business.create({
            data: { name: finalBusinessName, slug },
          });
          businessId = business.id;
        }

        const finalProvider = incomingProvider || AuthProvider.EMAIL_PASSWORD;

        return tx.user.create({
          data: {
            firebaseUid: dto.firebaseUid,
            email: dto.email,
            fullName: dto.fullName || dto.email.split("@")[0] || "User",
            role,
            authProvider: finalProvider,
            businessId,
          },
          include: { business: true },
        });
      });
    }

    return { user: existingUser };
  }

  static async linkProvider(userId: string) {
    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) {
      throw ApiError.notFound("User not found in system database");
    }

    // Retrieve Firebase user profile to inspect linked login providers
    const fbUser = await admin.auth().getUser(userRecord.firebaseUid);

    // If there is only one provider (or fewer) linked, then linking didn't actually happen on Firebase
    if (!fbUser.providerData || fbUser.providerData.length <= 1) {
      throw ApiError.badRequest(
        "Account has not been linked to multiple providers on Firebase.",
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { authProvider: AuthProvider.MULTI_PROVIDER },
      include: { business: true },
    });
    return { user };
  }

  /**
   * Fetches live authentication provider IDs for a Firebase UID
   */
  static async getProviders(firebaseUid: string) {
    const fbUser = await admin.auth().getUser(firebaseUid);
    const providers = fbUser.providerData.map((p) => p.providerId);
    return { providers };
  }
}
