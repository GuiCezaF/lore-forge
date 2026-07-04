import { randomUUID } from 'node:crypto';
import { AUTH_AUDIENCE, AUTH_ISSUER } from './auth.constants';
import { createJwt, verifyJwt } from './jwt';

export const AUTH_HANDOFF_AUDIENCE = 'loreforge-auth-handoff';
export const HANDOFF_TOKEN_LIFETIME_SECONDS = 60;

export interface HandoffTokenClaims {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

export function buildHandoffToken(
  session: { accessToken: string; refreshToken: string },
  secret: string,
): string {
  return createJwt<HandoffTokenClaims>(
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      jti: randomUUID(),
    },
    secret,
    HANDOFF_TOKEN_LIFETIME_SECONDS,
    AUTH_ISSUER,
    AUTH_HANDOFF_AUDIENCE,
  );
}

export function verifyHandoffToken(
  token: string,
  secret: string,
): HandoffTokenClaims {
  return verifyJwt<HandoffTokenClaims>(
    token,
    secret,
    AUTH_ISSUER,
    AUTH_HANDOFF_AUDIENCE,
  );
}
