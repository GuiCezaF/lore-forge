import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { buildRefreshToken } from '../auth/jwt';
import { RefreshTokenClaims } from '../auth/auth.types';

const JWT_SECRET = 'users-service-test-secret';

describe('UsersService', () => {
  let service: UsersService;

  const googleProfile = {
    sub: 'google-subject-1',
    email: 'player@loreforge.test',
    name: 'Player One',
    picture: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    service = new UsersService();
  });

  describe('upsertGoogleUser', () => {
    it('creates a new user with default role and plan', () => {
      const user = service.upsertGoogleUser(googleProfile);

      expect(user.email).toBe(googleProfile.email);
      expect(user.role).toBe('user');
      expect(user.plan).toBe('free');
      expect(user.tokenVersion).toBe(0);
    });

    it('updates profile data on subsequent logins', () => {
      const first = service.upsertGoogleUser(googleProfile);
      const updated = service.upsertGoogleUser({
        ...googleProfile,
        name: 'Player Updated',
      });

      expect(updated.id).toBe(first.id);
      expect(updated.name).toBe('Player Updated');
    });
  });

  describe('findAuthUserById', () => {
    it('returns auth user by id', () => {
      const created = service.upsertGoogleUser(googleProfile);
      const found = service.findAuthUserById(created.id);

      expect(found.email).toBe(created.email);
    });

    it('throws when user does not exist', () => {
      expect(() => service.findAuthUserById('missing-id')).toThrow(NotFoundException);
    });
  });

  describe('refresh token lifecycle', () => {
    it('validates a stored refresh token', () => {
      const user = service.upsertGoogleUser(googleProfile);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-1' },
        JWT_SECRET,
        3600,
      );
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      service.updateRefreshToken(
        user.id,
        refreshToken,
        expiresAt,
        user.tokenVersion,
      );

      const validated = service.validateRefreshToken(
        user.id,
        refreshToken,
        user.tokenVersion,
      );

      expect(validated.id).toBe(user.id);
    });

    it('rejects refresh token with version mismatch', () => {
      const user = service.upsertGoogleUser(googleProfile);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-2' },
        JWT_SECRET,
        3600,
      );

      service.updateRefreshToken(
        user.id,
        refreshToken,
        new Date(Date.now() + 3600 * 1000),
        user.tokenVersion,
      );

      expect(() =>
        service.validateRefreshToken(user.id, refreshToken, user.tokenVersion + 1),
      ).toThrow(UnauthorizedException);
    });

    it('invalidates refresh token after logout', () => {
      const user = service.upsertGoogleUser(googleProfile);
      const refreshToken = buildRefreshToken(
        { sub: user.id, tokenVersion: user.tokenVersion, jti: 'jti-3' },
        JWT_SECRET,
        3600,
      );

      service.updateRefreshToken(
        user.id,
        refreshToken,
        new Date(Date.now() + 3600 * 1000),
        user.tokenVersion,
      );
      service.clearRefreshToken(user.id);

      expect(() =>
        service.validateRefreshToken(user.id, refreshToken, user.tokenVersion),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('returns public profile without sensitive fields', () => {
      const user = service.upsertGoogleUser(googleProfile);
      const profile = service.getProfile(user.id);

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
