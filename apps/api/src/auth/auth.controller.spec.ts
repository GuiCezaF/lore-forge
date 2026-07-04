import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response, Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUser } from './auth.types';
import { OAUTH_STATE_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      | 'buildGoogleLogin'
      | 'handleGoogleCallback'
      | 'attachAuthCookies'
      | 'getPostLoginRedirectUrl'
      | 'shouldUseAuthHandoff'
      | 'buildHandoffRedirectUrl'
      | 'refreshFromCookies'
      | 'logoutFromCookies'
      | 'clearAuthCookies'
      | 'isProduction'
    >
  >;

  const authUser: AuthUser = {
    id: 'user-1',
    provider: 'google',
    providerSubject: 'google:sub-1',
    email: 'player@loreforge.test',
    shortCode: 'lf-abc123',
    name: 'Player',
    role: 'user',
    plan: 'free',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    tokenVersion: 0,
  };

  beforeEach(async () => {
    authService = {
      buildGoogleLogin: jest.fn(),
      handleGoogleCallback: jest.fn(),
      attachAuthCookies: jest.fn(),
      getPostLoginRedirectUrl: jest.fn(),
      shouldUseAuthHandoff: jest.fn(),
      buildHandoffRedirectUrl: jest.fn(),
      refreshFromCookies: jest.fn(),
      logoutFromCookies: jest.fn(),
      clearAuthCookies: jest.fn(),
      isProduction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('loginWithGoogle', () => {
    it('redirects to Google and sets OAuth state cookie', () => {
      authService.buildGoogleLogin.mockReturnValue({
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        oauthStateCookie: 'signed-state',
      });
      authService.isProduction.mockReturnValue(false);

      const cookies = new Map<string, unknown>();
      const res = {
        cookie: jest.fn((name: string, value: string) => {
          cookies.set(name, value);
        }),
        redirect: jest.fn(),
      } as unknown as Response;

      controller.loginWithGoogle(res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://accounts.google.com/o/oauth2/v2/auth',
      );
      expect(cookies.get(OAUTH_STATE_COOKIE)).toBe('signed-state');
    });
  });

  describe('googleCallback', () => {
    it('creates session and redirects to frontend', async () => {
      const session = {
        user: authUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.handleGoogleCallback.mockResolvedValue(session);
      authService.shouldUseAuthHandoff.mockReturnValue(false);
      authService.getPostLoginRedirectUrl.mockReturnValue(
        'http://localhost:3001',
      );

      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      const req = {
        headers: { cookie: `${OAUTH_STATE_COOKIE}=state-value` },
      } as Request;

      await controller.googleCallback('auth-code', 'state-id', req, res);

      expect(authService.handleGoogleCallback).toHaveBeenCalledWith({
        code: 'auth-code',
        state: 'state-id',
        stateCookie: req.headers.cookie,
      });
      expect(authService.attachAuthCookies).toHaveBeenCalledWith(res, session);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3001');
    });

    it('redirects through auth handoff when frontend and API are split', async () => {
      const session = {
        user: authUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.handleGoogleCallback.mockResolvedValue(session);
      authService.shouldUseAuthHandoff.mockReturnValue(true);
      authService.buildHandoffRedirectUrl.mockReturnValue(
        'http://localhost:3001/auth/callback?handoff=signed-token',
      );

      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      const req = {
        headers: { cookie: `${OAUTH_STATE_COOKIE}=state-value` },
      } as Request;

      await controller.googleCallback('auth-code', 'state-id', req, res);

      expect(authService.buildHandoffRedirectUrl).toHaveBeenCalledWith(session);
      expect(authService.attachAuthCookies).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/callback?handoff=signed-token',
      );
    });

    it('rejects callback without code or state', async () => {
      const res = {} as Response;
      const req = { headers: {} } as Request;

      await expect(
        controller.googleCallback(undefined, undefined, req, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates session and returns authenticated user', async () => {
      const session = {
        user: authUser,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      authService.refreshFromCookies.mockResolvedValue(session);

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status } as unknown as Response;
      const req = {
        headers: { cookie: `${REFRESH_TOKEN_COOKIE}=refresh-token` },
      } as Request;

      await controller.refresh(req, res);

      expect(authService.refreshFromCookies).toHaveBeenCalledWith(
        req.headers.cookie,
      );
      expect(authService.attachAuthCookies).toHaveBeenCalledWith(res, session);
      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(authUser);
    });
  });

  describe('logout', () => {
    it('revokes session and clears cookies', async () => {
      const send = jest.fn();
      const status = jest.fn().mockReturnValue({ send });
      const res = { status } as unknown as Response;
      const req = {
        headers: { cookie: `${REFRESH_TOKEN_COOKIE}=refresh-token` },
      } as Request;

      await controller.logout(req, res);

      expect(authService.logoutFromCookies).toHaveBeenCalledWith(
        req.headers.cookie,
      );
      expect(authService.clearAuthCookies).toHaveBeenCalledWith(res);
      expect(status).toHaveBeenCalledWith(204);
      expect(send).toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('returns authenticated user from decorator context', () => {
      expect(controller.me(authUser)).toEqual(authUser);
    });
  });
});
