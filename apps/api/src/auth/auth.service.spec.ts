import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { buildAccessToken } from './jwt';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './auth.constants';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const googleProfile = {
    sub: 'google-subject-auth',
    email: 'auth@loreforge.test',
    name: 'Auth Player',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'auth-service-test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

    usersService = new UsersService();
    service = new AuthService(usersService);
  });

  describe('createSession', () => {
    it('returns access and refresh tokens for a user', () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);

      expect(session.user.id).toBe(user.id);
      expect(session.accessToken).toEqual(expect.any(String));
      expect(session.refreshToken).toEqual(expect.any(String));
    });

    it('persists refresh token hash in user record', () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      service.createSession(user);

      const stored = usersService.findAuthUserById(user.id);
      expect(stored.refreshTokenHash).toEqual(expect.any(String));
      expect(stored.refreshTokenExpiresAt).toEqual(expect.any(String));
    });
  });

  describe('verifyAccessToken', () => {
    it('returns user for a valid access token', () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);

      const verified = service.verifyAccessToken(session.accessToken);

      expect(verified.id).toBe(user.id);
      expect(verified.email).toBe(user.email);
    });

    it('rejects token after token version changes', () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);
      usersService.clearRefreshToken(user.id);

      expect(() => service.verifyAccessToken(session.accessToken)).toThrow(
        UnauthorizedException,
      );
    });

    it('rejects malformed token', () => {
      expect(() => service.verifyAccessToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshFromCookies', () => {
    it('rotates session from refresh cookie', async () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);
      const cookieHeader = `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`;

      const refreshed = await service.refreshFromCookies(cookieHeader);

      expect(refreshed.user.id).toBe(user.id);
      expect(refreshed.refreshToken).not.toBe(session.refreshToken);
      expect(service.verifyAccessToken(refreshed.accessToken).id).toBe(user.id);
    });

    it('rejects missing refresh cookie', async () => {
      await expect(service.refreshFromCookies(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logoutFromCookies', () => {
    it('clears refresh token for valid session', async () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);
      const cookieHeader = `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`;

      await service.logoutFromCookies(cookieHeader);

      const stored = usersService.findAuthUserById(user.id);
      expect(stored.refreshTokenHash).toBeNull();
      expect(stored.tokenVersion).toBe(user.tokenVersion + 1);
    });

    it('ignores invalid refresh cookie silently', async () => {
      await expect(
        service.logoutFromCookies(`${REFRESH_TOKEN_COOKIE}=invalid-token`),
      ).resolves.toBeUndefined();
    });
  });

  describe('attachAuthCookies / clearAuthCookies', () => {
    it('sets and clears auth cookies on response', () => {
      const user = usersService.upsertGoogleUser(googleProfile);
      const session = service.createSession(user);
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
    it('rejects token for unknown user', () => {
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

      expect(() => service.verifyAccessToken(token)).toThrow(NotFoundException);
    });
  });
});
