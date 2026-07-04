import {
  BadRequestException,
  Inject,
  Optional,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_LIFETIME_SECONDS,
  OAUTH_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_LIFETIME_SECONDS,
} from './auth.constants';
import { AccessTokenClaims, AuthUser, RefreshTokenClaims } from './auth.types';
import {
  buildAccessToken,
  buildRefreshToken,
  hashToken,
  verifyJwt,
} from './jwt';
import {
  buildGoogleAuthorizationUrl,
  createRefreshTokenId,
  exchangeGoogleCodeForProfile,
} from './oauth-google';
import { verifyOAuthState } from './oauth-state';
import { getEnvironment } from '../config/environment';
import { UsersService } from '../users/users.service';
import type { IAuthSessionRepository } from './auth-session.repository.interface';
import type { AuthSessionRecord } from './auth-session.types';
import { InMemoryAuthSessionRepository } from './infrastructure/in-memory-auth-session.repository';
import { buildHandoffToken, verifyHandoffToken } from './auth-handoff';
import { buildSessionCookieOptions, hasSplitOrigins } from './auth-cookies';

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

@Injectable()
export class AuthService {
  private readonly fallbackSessionRepository =
    new InMemoryAuthSessionRepository();

  constructor(
    private readonly usersService: UsersService,
    @Optional()
    @Inject('IAuthSessionRepository')
    private readonly authSessionRepository?: IAuthSessionRepository,
  ) {}

  private getSessionRepository(): IAuthSessionRepository {
    return this.authSessionRepository ?? this.fallbackSessionRepository;
  }

  private getEnvironment() {
    return getEnvironment();
  }

  isProduction(): boolean {
    return this.getEnvironment().NODE_ENV === 'production';
  }

  getJwtSecret(): string {
    return this.getEnvironment().JWT_SECRET;
  }

  getGoogleClientId(): string {
    const value = this.getEnvironment().GOOGLE_CLIENT_ID;
    if (!value) {
      throw new Error('GOOGLE_CLIENT_ID is required');
    }
    return value;
  }

  getGoogleClientSecret(): string {
    const value = this.getEnvironment().GOOGLE_CLIENT_SECRET;
    if (!value) {
      throw new Error('GOOGLE_CLIENT_SECRET is required');
    }
    return value;
  }

  getGoogleRedirectUri(): string {
    return (
      this.getEnvironment().GOOGLE_OAUTH_REDIRECT_URI ??
      `${this.getApiBaseUrl()}/auth/google/callback`
    );
  }

  getApiBaseUrl(): string {
    return this.getEnvironment().API_BASE_URL;
  }

  getFrontendBaseUrl(): string {
    return this.getEnvironment().FRONTEND_BASE_URL;
  }

  getPostLoginRedirectUrl(): string {
    return this.getEnvironment().POST_LOGIN_REDIRECT_URL;
  }

  getPrimaryFrontendBaseUrl(): string {
    return this.getFrontendBaseUrl().split(',')[0]?.trim() ?? '';
  }

  shouldUseAuthHandoff(): boolean {
    return hasSplitOrigins();
  }

  buildHandoffRedirectUrl(session: {
    accessToken: string;
    refreshToken: string;
  }): string {
    const handoffToken = buildHandoffToken(session, this.getJwtSecret());
    const redirectUrl = new URL(
      '/auth/callback',
      this.getPrimaryFrontendBaseUrl(),
    );
    redirectUrl.searchParams.set('handoff', handoffToken);
    return redirectUrl.toString();
  }

  async redeemHandoffToken(handoffToken: string): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    let claims;
    try {
      claims = verifyHandoffToken(handoffToken, this.getJwtSecret());
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    const user = await this.verifyAccessToken(claims.accessToken);
    return {
      user,
      accessToken: claims.accessToken,
      refreshToken: claims.refreshToken,
    };
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

    const user = await this.usersService.upsertGoogleUser(
      profilePayload.profile,
    );
    return this.createSession(user);
  }

  async bypassLogin(): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const mockProfile = {
      sub: 'mock-dev-id-123',
      email: 'investigator@loreforge.local',
      name: 'Arthur Cervero',
      picture: 'https://avatar.vercel.sh/arthur',
    };
    const user = await this.usersService.upsertGoogleUser(mockProfile);
    return this.createSession(user);
  }

  async createSession(user: AuthUser): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshTokenId = createRefreshTokenId();
    const refreshToken = buildRefreshToken(
      this.buildRefreshClaims(user, refreshTokenId, user.tokenVersion),
      this.getJwtSecret(),
      REFRESH_TOKEN_LIFETIME_SECONDS,
    );
    const refreshTokenHash = hashToken(refreshToken, this.getJwtSecret());
    const now = new Date().toISOString();
    const session: AuthSessionRecord = {
      id: randomUUID(),
      userId: user.id,
      refreshTokenHash,
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_LIFETIME_SECONDS * 1000,
      ).toISOString(),
      createdAt: now,
      revokedAt: null,
      userAgent: null,
      ipAddress: null,
    };

    await this.getSessionRepository().create(session);
    const updatedUser = await this.usersService.updateLoginMetadata(user.id);
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

    const session = await this.getSessionRepository().findByRefreshTokenHash(
      hashToken(refreshToken, this.getJwtSecret()),
    );
    if (!session) {
      throw new UnauthorizedException('Refresh token not found');
    }
    if (session.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    if (Date.parse(session.expiresAt) <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findAuthUserById(claims.sub);
    if (user.tokenVersion !== claims.tokenVersion) {
      throw new UnauthorizedException('Refresh token version mismatch');
    }

    await this.getSessionRepository().revokeByRefreshTokenHash(
      session.refreshTokenHash,
      new Date().toISOString(),
    );

    return this.createSession(user);
  }

  async logoutFromCookies(cookieHeader: string | undefined): Promise<void> {
    const refreshToken = readCookie(cookieHeader, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      return;
    }

    try {
      verifyJwt<RefreshTokenClaims>(refreshToken, this.getJwtSecret());
      await this.getSessionRepository().revokeByRefreshTokenHash(
        hashToken(refreshToken, this.getJwtSecret()),
        new Date().toISOString(),
      );
    } catch {
      return;
    }
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    let claims: AccessTokenClaims;
    try {
      claims = verifyJwt<AccessTokenClaims>(token, this.getJwtSecret());
    } catch (error) {
      throw new UnauthorizedException((error as Error).message);
    }

    const user = await this.usersService.findAuthUserById(claims.sub);

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
      buildSessionCookieOptions(ACCESS_TOKEN_LIFETIME_SECONDS),
    );
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      buildSessionCookieOptions(REFRESH_TOKEN_LIFETIME_SECONDS),
    );
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
  }

  clearAuthCookies(res: Response): void {
    const domain = this.getEnvironment().COOKIE_DOMAIN || undefined;
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
