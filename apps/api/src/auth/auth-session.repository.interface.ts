import type { AuthSessionRecord } from './auth-session.types';

export interface IAuthSessionRepository {
  create(session: AuthSessionRecord): Promise<void>;
  findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionRecord | null>;
  revokeByRefreshTokenHash(
    refreshTokenHash: string,
    revokedAt: string,
  ): Promise<void>;
  revokeByUserId(userId: string, revokedAt: string): Promise<void>;
}
