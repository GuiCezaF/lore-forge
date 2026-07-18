import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { buildAccessToken, hashToken } from './jwt';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import { InMemoryUserRepository } from '../modules/users/infrastructure/repositories/in-memory-user.repository';
import { InMemoryAuthSessionRepository } from './infrastructure/in-memory-auth-session.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemoryAuthSessionRepository;

  const googleProfile = {
    sub: 'google-subject-auth',
    email: 'auth@loreforge.test',
    name: 'Auth Player',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'auth-service-test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemoryAuthSessionRepository();
    usersService = new UsersService(userRepo);
    service = new AuthService(usersService, sessionRepo);
  });

  describe('createSession', () => {
    it('returns access and refresh tokens for a user', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);

      expect(session.user.id).toBe(user.id);
      expect(session.accessToken).toEqual(expect.any(String));
      expect(session.refreshToken).toEqual(expect.any(String));
    });

    it('persists refresh token in auth sessions table', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);

      const stored = await sessionRepo.findByRefreshTokenHash(
        hashToken(session.refreshToken, service.getJwtSecret()),
      );

      expect(stored).toMatchObject({
        userId: user.id,
        revokedAt: null,
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('returns user for a valid access token', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);

      const verified = await service.verifyAccessToken(session.accessToken);

      expect(verified.id).toBe(user.id);
      expect(verified.email).toBe(user.email);
    });

    it('rejects token after the account is deleted', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);
      await usersService.deleteAccount(user.id);

      await expect(
        service.verifyAccessToken(session.accessToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects malformed token', async () => {
      await expect(service.verifyAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshFromCookies', () => {
    it('rotates session from refresh cookie', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);
      const cookieHeader = `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`;

      const refreshed = await service.refreshFromCookies(cookieHeader);

      expect(refreshed.user.id).toBe(user.id);
      expect(refreshed.refreshToken).not.toBe(session.refreshToken);
      expect((await service.verifyAccessToken(refreshed.accessToken)).id).toBe(
        user.id,
      );
    });

    it('rejects missing refresh cookie', async () => {
      await expect(service.refreshFromCookies(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logoutFromCookies', () => {
    it('revokes the session and access token for a valid cookie', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);
      const cookieHeader = `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`;

      await service.logoutFromCookies(cookieHeader);

      const tokenRecord = await sessionRepo.findByRefreshTokenHash(
        hashToken(session.refreshToken, service.getJwtSecret()),
      );
      expect(tokenRecord?.revokedAt).toEqual(expect.any(String));
      await expect(service.verifyAccessToken(session.accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('ignores invalid refresh cookie silently', async () => {
      await expect(
        service.logoutFromCookies(`${REFRESH_TOKEN_COOKIE}=invalid-token`),
      ).resolves.toBeUndefined();
    });
  });

  describe('attachAuthCookies / clearAuthCookies', () => {
    it('sets and clears auth cookies on response', async () => {
      const user = await usersService.upsertGoogleUser(googleProfile);
      const session = await service.createSession(user);
      const cookies = new Map<string, string>();
      const cleared = new Set<string>();

      const res = {
        cookie: (name: string, value: string) => {
          cookies.set(name, value);
        },
        clearCookie: (name: string) => {
          cleared.add(name);
          cookies.delete(name);
        },
      };

      service.attachAuthCookies(res as never, session);
      expect(cookies.get(ACCESS_TOKEN_COOKIE)).toBe(session.accessToken);
      expect(cookies.get(REFRESH_TOKEN_COOKIE)).toBe(session.refreshToken);

      service.clearAuthCookies(res as never);
      expect(cleared.has(ACCESS_TOKEN_COOKIE)).toBe(true);
      expect(cleared.has(REFRESH_TOKEN_COOKIE)).toBe(true);
    });
  });

  describe('buildGoogleLogin', () => {
    it('builds Google authorization URL and state cookie', () => {
      const result = service.buildGoogleLogin();

      expect(result.authorizationUrl).toContain('accounts.google.com');
      expect(result.oauthStateCookie).toEqual(expect.any(String));
    });
  });

  describe('verifyAccessToken with manually built token', () => {
    it('rejects token for unknown user', async () => {
      const token = buildAccessToken(
        {
          sub: 'missing-user',
          email: 'ghost@loreforge.test',
          name: 'Ghost',
          role: 'user',
          plan: 'free',
          tokenVersion: 0,
        },
        service.getJwtSecret(),
        3600,
      );

      await expect(service.verifyAccessToken(token)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
