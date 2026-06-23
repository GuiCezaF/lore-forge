import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthUser, GoogleUserInfo } from '../auth/auth.types';
import { hashToken, safeEqualHash } from '../auth/jwt';
import { UserRecord, PublicUser } from './users.types';

@Injectable()
export class UsersService {
  private readonly usersById = new Map<string, UserRecord>();
  private readonly usersByProviderSubject = new Map<string, string>();

  findPublicById(id: string): PublicUser {
    const user = this.usersById.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  findAuthUserById(id: string): AuthUser {
    const user = this.usersById.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAuthUser(user);
  }

  findAuthUserByProviderSubject(providerSubject: string): AuthUser | undefined {
    const userId = this.usersByProviderSubject.get(providerSubject);
    if (!userId) {
      return undefined;
    }

    const user = this.usersById.get(userId);
    return user ? this.toAuthUser(user) : undefined;
  }

  upsertGoogleUser(profile: GoogleUserInfo): AuthUser {
    const providerSubject = `google:${profile.sub}`;
    const existingId = this.usersByProviderSubject.get(providerSubject);
    const now = new Date().toISOString();

    if (!existingId) {
      const record: UserRecord = {
        id: randomUUID(),
        provider: 'google',
        providerSubject,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        role: 'user',
        plan: 'free',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        tokenVersion: 0,
      };
      this.usersById.set(record.id, record);
      this.usersByProviderSubject.set(providerSubject, record.id);
      return this.toAuthUser(record);
    }

    const current = this.usersById.get(existingId);
    if (!current) {
      throw new NotFoundException('User not found');
    }

    const merged: UserRecord = {
      ...current,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      updatedAt: now,
      lastLoginAt: now,
    };

    this.usersById.set(existingId, merged);
    return this.toAuthUser(merged);
  }

  updateLoginMetadata(userId: string): AuthUser {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated: UserRecord = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.usersById.set(userId, updated);
    return this.toAuthUser(updated);
  }

  updateRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    tokenVersion: number,
  ): AuthUser {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated: UserRecord = {
      ...user,
      refreshTokenHash: hashToken(
        refreshToken,
        process.env.JWT_SECRET ?? 'loreforge-dev-secret',
      ),
      refreshTokenExpiresAt: expiresAt.toISOString(),
      tokenVersion,
      updatedAt: new Date().toISOString(),
    };

    this.usersById.set(userId, updated);
    return this.toAuthUser(updated);
  }

  clearRefreshToken(userId: string): AuthUser {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updated: UserRecord = {
      ...user,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      tokenVersion: user.tokenVersion + 1,
      updatedAt: new Date().toISOString(),
    };

    this.usersById.set(userId, updated);
    return this.toAuthUser(updated);
  }

  validateRefreshToken(
    userId: string,
    refreshToken: string,
    tokenVersion: number,
  ): AuthUser {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (Date.parse(user.refreshTokenExpiresAt) <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException('Refresh token version mismatch');
    }

    const expected = user.refreshTokenHash;
    const actual = hashToken(
      refreshToken,
      process.env.JWT_SECRET ?? 'loreforge-dev-secret',
    );

    if (!safeEqualHash(expected, actual)) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    return this.toAuthUser(user);
  }

  getProfile(userId: string): PublicUser {
    return this.findPublicById(userId);
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private toAuthUser(user: UserRecord): AuthUser {
    return {
      ...this.toPublicUser(user),
      providerSubject: user.providerSubject,
      refreshTokenHash: user.refreshTokenHash ?? null,
      refreshTokenExpiresAt: user.refreshTokenExpiresAt ?? null,
      tokenVersion: user.tokenVersion,
    };
  }
}
