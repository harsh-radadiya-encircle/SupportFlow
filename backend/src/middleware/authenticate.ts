import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { admin, isFirebaseInitialized } from "../config/firebase";
import { prisma } from "../utils/prisma";
import { AuthenticatedRequest } from "../common/types";
import { ApiError } from "../common/exceptions/apiError";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No authorization token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!isFirebaseInitialized) {
      throw ApiError.internal(
        "Firebase Authentication is not initialized on the backend",
      );
    }

    let decodedUid: string;
    let decodedEmail: string | null = null;

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      decodedUid = decodedToken.uid;
      decodedEmail = decodedToken.email || null;
    } catch (err: any) {
      throw ApiError.unauthorized("Invalid or expired authentication token");
    }

    // 3. Lookup User in Database strictly via firebaseUid
    let dbUser = await prisma.user.findUnique({
      where: {
        firebaseUid: decodedUid,
      },
      include: {
        business: true,
      },
    });

    if (!dbUser) {
      // Self-heal: Create PostgreSQL User dynamically from Firebase token data
      dbUser = await prisma.$transaction(async (tx) => {
        let role: Role = Role.CUSTOMER;
        let businessId: string | null = null;

        // Check if they have an active pending invitation
        const invitation = await tx.invitation.findFirst({
          where: { email: decodedEmail || "", isAccepted: false },
        });

        if (invitation) {
          role = invitation.role;
          businessId = invitation.businessId;
          await tx.invitation.update({
            where: { id: invitation.id },
            data: { isAccepted: true },
          });
        }

        return tx.user.create({
          data: {
            firebaseUid: decodedUid,
            email: decodedEmail || "",
            fullName: decodedEmail ? decodedEmail.split("@")[0] : "User",
            role,
            authProvider: "EMAIL_PASSWORD",
            businessId,
          },
          include: {
            business: true,
          },
        });
      });
      console.log(
        `[Self-Healing] Created missing Postgres user profile for ${dbUser.email}`,
      );
    }

    if (!dbUser.isActive) {
      throw ApiError.forbidden(
        "Your account has been deactivated. Please contact support.",
      );
    }

    if (dbUser.business?.isSuspended) {
      throw ApiError.forbidden(
        "Your business account has been suspended by system administrator.",
      );
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
