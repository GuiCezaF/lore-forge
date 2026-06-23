import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_LIFETIME_SECONDS,
  OAUTH_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_LIFETIME_SECONDS,
} from './auth.constants';
import { AccessTokenClaims, AuthUser, RefreshTokenClaims } from './auth.types';
import { buildAccessToken, buildRefreshToken, verifyJwt } from './jwt';
import {
  buildGoogleAuthorizationUrl,
  createRefreshTokenId,
  exchangeGoogleCodeForProfile,
} from './oauth-google';
import { verifyOAuthState } from './oauth-state';
import { UsersService } from '../users/users.service';

function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function buildCookieOptions(maxAgeSeconds: number, secure: boolean) {
  const domain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    domain: domain || undefined,
    maxAge: maxAgeSeconds * 1000,
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  isProduction(): boolean {
    return (process.env.NODE_ENV ?? 'development') === 'production';
  }

  getJwtSecret(): string {
    return process.env.JWT_SECRET ?? 'loreforge-dev-secret';
  }

  getGoogleClientId(): string {
    const value = process.env.GOOGLE_CLIENT_ID;
    if (!value) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    return value;
  }

  getGoogleClientSecret(): string {
    const value = process.env.GOOGLE_CLIENT_SECRET;
    if (!value) {
      throw new Error('GOOGLE_CLIENT_SECRET is required');
    }
    return value;
  }

  getGoogleRedirectUri(): string {
    return (
      process.env.GOOGLE_OAUTH_REDIRECT_URI ??
      `${this.getApiBaseUrl()}/auth/google/callback`
    );
  }

  getApiBaseUrl(): string {
    return process.env.API_BASE_URL ?? 'http://localhost:3001';
  }

  getFrontendBaseUrl(): string {
    return process.env.FRONTEND_BASE_URL ?? 'http://localhost:3001';
  }

  getPostLoginRedirectUrl(): string {
    return process.env.POST_LOGIN_REDIRECT_URL ?? this.getFrontendBaseUrl();
  }

  buildGoogleLogin(): { authorizationUrl: string; oauthStateCookie: string } {
    return buildGoogleAuthorizationUrl({
      clientId: this.getGoogleClientId(),
      redirectUri: this.getGoogleRedirectUri(),
      secret: this.getJwtSecret(),
    });
  }

  async handleGoogleCallback(options: {
    code: string;
    state: string;
    stateCookie: string | undefined;
  }): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    const oauthStateValue = readCookie(options.stateCookie, OAUTH_STATE_COOKIE);
    if (!oauthStateValue) {
      throw new UnauthorizedException('Missing OAuth state cookie');
    }

    let parsedState;
    try {
      parsedState = verifyOAuthState(oauthStateValue, this.getJwtSecret());
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    if (parsedState.state !== options.state) {
      throw new UnauthorizedException('OAuth state mismatch');
    }

    let profilePayload;
    try {
      profilePayload = await exchangeGoogleCodeForProfile({
        clientId: this.getGoogleClientId(),
        clientSecret: this.getGoogleClientSecret(),
        code: options.code,
        codeVerifier: parsedState.codeVerifier,
        redirectUri: this.getGoogleRedirectUri(),
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const user = this.usersService.upsertGoogleUser(profilePayload.profile);
    return this.createSession(user);
  }

  createSession(user: AuthUser): {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  } {
    const tokenVersion = user.tokenVersion;
    const refreshTokenId = createRefreshTokenId();
    const refreshToken = buildRefreshToken(
      this.buildRefreshClaims(user, refreshTokenId, tokenVersion),
      this.getJwtSecret(),
      REFRESH_TOKEN_LIFETIME_SECONDS,
    );
    const updatedUser = this.usersService.updateRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + REFRESH_TOKEN_LIFETIME_SECONDS * 1000),
      tokenVersion,
    );
    const accessToken = buildAccessToken(
      this.buildAccessClaims(updatedUser),
      this.getJwtSecret(),
      ACCESS_TOKEN_LIFETIME_SECONDS,
    );

    return {
      user: updatedUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshFromCookies(cookieHeader: string | undefined): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshToken = readCookie(cookieHeader, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let claims: RefreshTokenClaims;
    try {
      claims = verifyJwt<RefreshTokenClaims>(refreshToken, this.getJwtSecret());
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    const user = this.usersService.validateRefreshToken(
      claims.sub,
      refreshToken,
      claims.tokenVersion,
    );
    return this.createSession(user);
  }

  async logoutFromCookies(cookieHeader: string | undefined): Promise<void> {
    const refreshToken = readCookie(cookieHeader, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      return;
    }

    try {
      const claims = verifyJwt<RefreshTokenClaims>(
        refreshToken,
        this.getJwtSecret(),
      );
      this.usersService.clearRefreshToken(claims.sub);
    } catch {
      return;
    }
  }

  verifyAccessToken(token: string): AuthUser {
    let claims: AccessTokenClaims;
    try {
      claims = verifyJwt<AccessTokenClaims>(token, this.getJwtSecret());
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    const user = this.usersService.findAuthUserById(claims.sub);

    if (user.tokenVersion !== claims.tokenVersion) {
      throw new UnauthorizedException('Token version mismatch');
    }

    return user;
  }

  attachAuthCookies(
    res: Response,
    session: { user: AuthUser; accessToken: string; refreshToken: string },
  ): void {
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      session.accessToken,
      buildCookieOptions(ACCESS_TOKEN_LIFETIME_SECONDS, this.isProduction()),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      buildCookieOptions(REFRESH_TOKEN_LIFETIME_SECONDS, this.isProduction()),
    );
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
  }

  clearAuthCookies(res: Response): void {
    const domain = process.env.COOKIE_DOMAIN || undefined;
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/', domain });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/', domain });
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/', domain });
  }

  private buildAccessClaims(user: AuthUser): AccessTokenClaims {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      plan: user.plan,
      tokenVersion: user.tokenVersion,
    };
  }

  private buildRefreshClaims(
    user: AuthUser,
    jti: string,
    tokenVersion: number,
  ): RefreshTokenClaims {
    return {
      sub: user.id,
      tokenVersion,
      jti,
    };
  }
}
