import { prisma } from "../../utils/prisma";
import { ApiError } from "../../common/exceptions/apiError";
import { TokenService } from "./services/token.service";
import { PasswordService } from "./services/password.service";
import { UserSyncService, SyncUserDto } from "./services/user-sync.service";

export { SyncUserDto };

export class AuthService {
  /**
   * Check which auth provider a user registered with (by email)
   */
  static async checkProvider(email: string) {
    return UserSyncService.checkProvider(email);
  }

  /**
   * Core auth sync — creates or updates user in PostgreSQL after Firebase auth succeeds.
   */
  static async syncOrRegisterUser(dto: SyncUserDto) {
    return UserSyncService.syncOrRegisterUser(dto);
  }

  /**
   * Generates a custom token for Firebase Authentication client-side sign-in
   */
  static async createFirebaseCustomToken(firebaseUid: string) {
    return TokenService.createFirebaseCustomToken(firebaseUid);
  }

  /**
   * Get Firebase custom token for an existing user by email
   */
  static async getCustomToken(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.notFound("User not found");
    const firebaseCustomToken = await TokenService.createFirebaseCustomToken(
      user.firebaseUid,
    );
    return { firebaseCustomToken };
  }

  /**
   * Log in user locally using email
   */
  static async login(email: string) {
    return UserSyncService.login(email);
  }

  /**
   * Sync/restore password via Firebase Admin SDK
   */
  static async syncPassword(email: string, password: string) {
    return PasswordService.syncPassword(email, password);
  }

  /**
   * Generates reset token and sends a password reset email
   */
  static async forgotPassword(email: string) {
    return PasswordService.forgotPassword(email);
  }

  /**
   * Resets password using a JWT reset token
   */
  static async resetPassword(token: string, newPassword?: string) {
    return PasswordService.resetPassword(token, newPassword);
  }
}
