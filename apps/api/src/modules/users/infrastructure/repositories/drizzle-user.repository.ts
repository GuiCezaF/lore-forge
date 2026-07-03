import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { DATABASE } from '../../../../database/database.constants';
import type { Database } from '../../../../database/database.types';
import { users } from '../../../../database/schema';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { UserRecord } from '../../../../users/users.types';

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    provider: row.provider as UserRecord['provider'],
    providerSubject: row.providerSubject,
    email: row.email,
    shortCode: row.shortCode,
    name: row.name,
    picture: row.picture ?? undefined,
    role: row.role,
    plan: row.plan,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    lastLoginAt: row.lastLoginAt ?? undefined,
    tokenVersion: row.tokenVersion,
  };
}

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(id: string): Promise<UserRecord | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? toUserRecord(row) : null;
  }

  async findByProviderSubject(
    providerSubject: string,
  ): Promise<UserRecord | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.providerSubject, providerSubject));
    return row ? toUserRecord(row) : null;
  }

  async findByShortCode(shortCode: string): Promise<UserRecord | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.shortCode, shortCode));
    return row ? toUserRecord(row) : null;
  }

  async findAll(): Promise<UserRecord[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(sql`${users.createdAt} desc`);
    return rows.map(toUserRecord);
  }

  async save(user: UserRecord): Promise<void> {
    await this.db
      .insert(users)
      .values({
        id: user.id,
        provider: user.provider,
        providerSubject: user.providerSubject,
        email: user.email,
        shortCode: user.shortCode,
        name: user.name,
        picture: user.picture ?? null,
        role: user.role,
        plan: user.plan,
        deletedAt: user.deletedAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt ?? null,
        tokenVersion: user.tokenVersion,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          provider: user.provider,
          providerSubject: user.providerSubject,
          email: user.email,
          shortCode: user.shortCode,
          name: user.name,
          picture: user.picture ?? null,
          role: user.role,
          plan: user.plan,
          deletedAt: user.deletedAt ?? null,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt ?? null,
          tokenVersion: user.tokenVersion,
        },
      });
  }

  async softDelete(id: string, deletedAt: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        deletedAt,
        updatedAt: deletedAt,
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, id));
  }
}
