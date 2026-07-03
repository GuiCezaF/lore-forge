import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import { authSessions } from '../../database/schema';
import type { IAuthSessionRepository } from '../auth-session.repository.interface';
import type { AuthSessionRecord } from '../auth-session.types';

function toSessionRecord(
  row: typeof authSessions.$inferSelect,
): AuthSessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    refreshTokenHash: row.refreshTokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt ?? null,
    userAgent: row.userAgent ?? null,
    ipAddress: row.ipAddress ?? null,
  };
}

@Injectable()
export class DrizzleAuthSessionRepository implements IAuthSessionRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(session: AuthSessionRecord): Promise<void> {
    await this.db.insert(authSessions).values({
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt ?? null,
      userAgent: session.userAgent ?? null,
      ipAddress: session.ipAddress ?? null,
    });
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSessionRecord | null> {
    const [row] = await this.db
      .select()
      .from(authSessions)
      .where(eq(authSessions.refreshTokenHash, refreshTokenHash));
    return row ? toSessionRecord(row) : null;
  }

  async revokeByRefreshTokenHash(
    refreshTokenHash: string,
    revokedAt: string,
  ): Promise<void> {
    await this.db
      .update(authSessions)
      .set({ revokedAt })
      .where(eq(authSessions.refreshTokenHash, refreshTokenHash));
  }

  async revokeByUserId(userId: string, revokedAt: string): Promise<void> {
    await this.db
      .update(authSessions)
      .set({ revokedAt })
      .where(eq(authSessions.userId, userId));
  }
}
