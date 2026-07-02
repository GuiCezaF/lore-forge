import type { AuthSessionRecord } from '../auth-session.types';
import type { IAuthSessionRepository } from '../auth-session.repository.interface';

export class InMemoryAuthSessionRepository implements IAuthSessionRepository {
  private readonly sessions = new Map<string, AuthSessionRecord>();

  async create(session: AuthSessionRecord): Promise<void> {
    this.sessions.set(session.refreshTokenHash, session);
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionRecord | null> {
    return this.sessions.get(refreshTokenHash) ?? null;
  }

  async revokeByRefreshTokenHash(
    refreshTokenHash: string,
    revokedAt: string,
  ): Promise<void> {
    const session = this.sessions.get(refreshTokenHash);
    if (!session) {
      return;
    }
    this.sessions.set(refreshTokenHash, {
      ...session,
      revokedAt,
    });
  }

  async revokeByUserId(userId: string, revokedAt: string): Promise<void> {
    for (const [hash, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.set(hash, {
          ...session,
          revokedAt,
        });
      }
    }
  }
}
