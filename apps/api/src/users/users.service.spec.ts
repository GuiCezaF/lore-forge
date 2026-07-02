import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { buildRefreshToken } from '../auth/jwt';
import { RefreshTokenClaims } from '../auth/auth.types';
import { InMemoryUserRepository } from '../modules/users/infrastructure/repositories/in-memory-user.repository';

const JWT_SECRET = 'users-service-test-secret';

describe('UsersService', () => {
  let service: UsersService;
  let repo: InMemoryUserRepository;

  const googleProfile = {
    sub: 'google-subject-1',
    email: 'player@loreforge.test',
    name: 'Player One',
    picture: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    repo = new InMemoryUserRepository();
    service = new UsersService(repo as any);
  });

  describe('upsertGoogleUser', () => {
    it('creates a new user with default role and plan', async () => {
      const user = await service.upsertGoogleUser(googleProfile as any);

      expect(user.email).toBe(googleProfile.email);
      expect(user.role).toBe('user');
      expect(user.plan).toBe('free');
      expect(user.tokenVersion).toBe(0);
    });

    it('updates profile data on subsequent logins', async () => {
      const first = await service.upsertGoogleUser(googleProfile as any);
      const updated = await service.upsertGoogleUser({
        ...googleProfile,
        name: 'Player Updated',
      } as any);

      expect(updated.id).toBe(first.id);
      expect(updated.name).toBe('Player Updated');
    });
  });

  describe('findAuthUserById', () => {
    it('returns auth user by id', async () => {
      const created = await service.upsertGoogleUser(googleProfile as any);
      const found = await service.findAuthUserById(created.id);

      expect(found.email).toBe(created.email);
    });

    it('throws when user does not exist', async () => {
      await expect(service.findAuthUserById('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('refresh token lifecycle', () => {
    it('validates a stored refresh token', async () => {
      const user = await service.upsertGoogleUser(googleProfile as any);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-1' },
        JWT_SECRET,
        3600,
      );
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      await service.updateRefreshToken(
        user.id,
        refreshToken,
        expiresAt,
        user.tokenVersion,
      );

      const validated = await service.validateRefreshToken(
        user.id,
        refreshToken,
        user.tokenVersion,
      );

      expect(validated.id).toBe(user.id);
    });

    it('rejects refresh token with version mismatch', async () => {
      const user = await service.upsertGoogleUser(googleProfile as any);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-2' },
        JWT_SECRET,
        3600,
      );

      await service.updateRefreshToken(
        user.id,
        refreshToken,
        new Date(Date.now() + 3600 * 1000),
        user.tokenVersion,
      );

      await expect(
        service.validateRefreshToken(user.id, refreshToken, user.tokenVersion + 1),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('invalidates refresh token after logout', async () => {
      const user = await service.upsertGoogleUser(googleProfile as any);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-3' },
        JWT_SECRET,
        3600,
      );

      await service.updateRefreshToken(
        user.id,
        refreshToken,
        new Date(Date.now() + 3600 * 1000),
        user.tokenVersion,
      );
      await service.clearRefreshToken(user.id);

      await expect(
        service.validateRefreshToken(user.id, refreshToken, user.tokenVersion),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns public profile without sensitive fields', async () => {
      const user = await service.upsertGoogleUser(googleProfile as any);
      const profile = await service.getProfile(user.id);

      expect(profile).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      });
      expect(profile).not.toHaveProperty('refreshTokenHash');
      expect(profile).not.toHaveProperty('tokenVersion');
    });
  });
});
