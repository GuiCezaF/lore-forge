import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthUser, GoogleUserInfo } from '../auth/auth.types';
import { hashToken, safeEqualHash } from '../auth/jwt';
import { UserRecord, PublicUser } from './users.types';
import type { IUserRepository } from '../modules/users/domain/repositories/user.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async findPublicById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }

  async findAuthUserById(id: string): Promise<AuthUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toAuthUser(user);
  }

  async findAuthUserByProviderSubject(providerSubject: string): Promise<AuthUser | undefined> {
    const user = await this.userRepository.findByProviderSubject(providerSubject);
    return user ? this.toAuthUser(user) : undefined;
  }

  async upsertGoogleUser(profile: GoogleUserInfo): Promise<AuthUser> {
    const providerSubject = `google:${profile.sub}`;
    const now = new Date().toISOString();
    const existing = await this.userRepository.findByProviderSubject(providerSubject);

    if (!existing) {
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
      await this.userRepository.save(record);
      return this.toAuthUser(record);
    }

    const merged: UserRecord = {
      ...existing,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      updatedAt: now,
      lastLoginAt: now,
    };

    await this.userRepository.save(merged);
    return this.toAuthUser(merged);
  }

  async updateLoginMetadata(userId: string): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const updated: UserRecord = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.userRepository.save(updated);
    return this.toAuthUser(updated);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
    tokenVersion: number,
  ): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);
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

    await this.userRepository.save(updated);
    return this.toAuthUser(updated);
  }

  async clearRefreshToken(userId: string): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);
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

    await this.userRepository.save(updated);
    return this.toAuthUser(updated);
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
    tokenVersion: number,
  ): Promise<AuthUser> {
    const user = await this.userRepository.findById(userId);
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

  async getProfile(userId: string): Promise<PublicUser> {
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
