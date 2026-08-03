import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../../../config/env";
import { admin, isFirebaseInitialized } from "../../../config/firebase";

export interface TokenPayloadUser {
  id: string;
  firebaseUid: string;
  email: string;
  role: Role;
  businessId: string | null;
}

export class TokenService {
  /**
   * Generates a local JWT token for user authorization
   */
  static generateJwtToken(user: TokenPayloadUser): string {
    return jwt.sign(
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
  }

  /**
   * Generates a custom token for Firebase Authentication client-side sign-in
   */
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
}
