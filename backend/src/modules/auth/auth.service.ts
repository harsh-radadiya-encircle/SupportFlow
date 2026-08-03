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
   * Links a new auth provider on the backend
   */
  static async linkProvider(userId: string) {
    return UserSyncService.linkProvider(userId);
  }
}
