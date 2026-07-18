import {
  Inject,
  Optional,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AuthUser, GoogleUserInfo } from '../auth/auth.types';
import { UserRecord, PublicUser } from './users.types';
import type { IUserRepository } from '../modules/users/domain/repositories/user.repository.interface';
import { generateShortCode } from './users.utils';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  authSessions,
  campaignMembers,
  campaigns,
  characters,
} from '../database/schema';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Optional()
    @Inject(DATABASE)
    private readonly db?: Database,
  ) {}

  async findPublicById(id: string): Promise<PublicUser> {
    const user = await this.findExistingUserById(id);
    return this.toPublicUser(user);
  }

  async findPublicByShortCode(shortCode: string): Promise<PublicUser> {
    const user = await this.userRepository.findByShortCode(shortCode);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  async findAuthUserById(id: string): Promise<AuthUser> {
    const user = await this.findExistingUserById(id);
    return this.toAuthUser(user);
  }

  async findAuthUserByProviderSubject(
    providerSubject: string,
  ): Promise<AuthUser | undefined> {
    const user =
      await this.userRepository.findByProviderSubject(providerSubject);
    return user && !user.deletedAt ? this.toAuthUser(user) : undefined;
  }

  async findAllPublicUsers(): Promise<PublicUser[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toPublicUser(user));
  }

  async upsertGoogleUser(profile: GoogleUserInfo): Promise<AuthUser> {
    const providerSubject = `google:${profile.sub}`;
    const now = new Date().toISOString();
    const existing =
      await this.userRepository.findByProviderSubject(providerSubject);

    if (!existing) {
      const record = await this.createUniqueUserRecord({
        providerSubject,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });
      await this.userRepository.save(record);
      return this.toAuthUser(record);
    }

    const merged: UserRecord = {
      ...existing,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      deletedAt: null,
      updatedAt: now,
      lastLoginAt: now,
    };

    await this.userRepository.save(merged);
    return this.toAuthUser(merged);
  }

  async updateProfile(
    userId: string,
    changes: { name?: string; picture?: string | null },
  ): Promise<PublicUser> {
    const user = await this.findExistingUserById(userId);
    const updated: UserRecord = {
      ...user,
      name: changes.name ?? user.name,
      picture:
        changes.picture === undefined
          ? user.picture
          : (changes.picture ?? undefined),
      updatedAt: new Date().toISOString(),
    };
    await this.userRepository.save(updated);
    return this.toPublicUser(updated);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findExistingUserById(userId);
    const now = new Date().toISOString();
    await this.userRepository.softDelete(user.id, now);
    if (!this.db) {
      return;
    }
    await this.db.transaction(async (trx) => {
      await trx.execute(
        sql`DELETE FROM campaign_spectator_access USING campaigns WHERE campaign_spectator_access.campaign_id = campaigns.id AND campaigns.owner_user_id = ${user.id}`,
      );
      await trx
        .update(campaigns)
        .set({ ownerUserId: null })
        .where(eq(campaigns.ownerUserId, user.id));
      await trx
        .delete(campaignMembers)
        .where(eq(campaignMembers.userId, user.id));
      await trx
        .update(characters)
        .set({
          frozenAt: now,
          updatedAt: now,
        })
        .where(eq(characters.ownerUserId, user.id));
      await trx
        .update(authSessions)
        .set({
          revokedAt: now,
        })
        .where(eq(authSessions.userId, user.id));
    });
  }

  async updateLoginMetadata(userId: string): Promise<AuthUser> {
    const user = await this.findExistingUserById(userId);
    const updated: UserRecord = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.userRepository.save(updated);
    return this.toAuthUser(updated);
  }

  async invalidateAccessTokens(userId: string): Promise<void> {
    await this.userRepository.incrementTokenVersion(userId);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    return this.findPublicById(userId);
  }

  private async findExistingUserById(id: string): Promise<UserRecord> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.deletedAt) {
      throw new UnauthorizedException('User account deleted');
    }
    return user;
  }

  private async createUniqueUserRecord(options: {
    providerSubject: string;
    email: string;
    name: string;
    picture?: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
  }): Promise<UserRecord> {
    let shortCode = generateShortCode();

    while (await this.userRepository.findByShortCode(shortCode)) {
      shortCode = generateShortCode();
    }

    return {
      id: randomUUID(),
      provider: 'google',
      providerSubject: options.providerSubject,
      email: options.email,
      shortCode,
      name: options.name,
      picture: options.picture,
      role: 'user',
      plan: 'free',
      createdAt: options.createdAt,
      updatedAt: options.updatedAt,
      lastLoginAt: options.lastLoginAt,
      tokenVersion: 0,
      deletedAt: null,
    };
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      shortCode: user.shortCode,
      picture: user.picture,
      provider: user.provider,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? null,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return {
      ...this.toPublicUser(user),
      providerSubject: user.providerSubject,
      tokenVersion: user.tokenVersion,
    };
  }
}
