import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_AUDIENCE, AUTH_ISSUER } from './auth.constants';
import { AccessTokenClaims, RefreshTokenClaims } from './auth.types';

type JwtPayloadBase = object;

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(`${padded}${'='.repeat(padLength)}`, 'base64');
}

function sign(value: string, secret: string): string {
  return base64UrlEncode(createHmac('sha256', secret).update(value).digest());
}

export function createJwt<T extends JwtPayloadBase>(
  payload: T,
  secret: string,
  expiresInSeconds: number,
  issuer = AUTH_ISSUER,
  audience = AUTH_AUDIENCE,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iss: issuer,
    aud: audience,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedBody}`, secret);

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyJwt<T extends JwtPayloadBase>(
  token: string,
  secret: string,
  issuer = AUTH_ISSUER,
  audience = AUTH_AUDIENCE,
): T {
  const [encodedHeader, encodedBody, signature] = token.split('.');
  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error('Malformed token');
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedBody}`, secret);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(
    base64UrlDecode(encodedBody).toString('utf8'),
  ) as JwtPayloadBase & {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
  };
  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== issuer) {
    throw new Error('Invalid issuer');
  }

  const audienceMatches = Array.isArray(payload.aud)
    ? payload.aud.includes(audience)
    : payload.aud === audience;
  if (!audienceMatches) {
    throw new Error('Invalid audience');
  }

  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new Error('Token expired');
  }

  if (typeof payload.nbf === 'number' && payload.nbf > now) {
    throw new Error('Token not active');
  }

  return payload as T;
}

export function buildAccessToken(
  payload: AccessTokenClaims,
  secret: string,
  expiresInSeconds: number,
): string {
  return createJwt(payload, secret, expiresInSeconds);
}

export function buildRefreshToken(
  payload: RefreshTokenClaims,
  secret: string,
  expiresInSeconds: number,
): string {
  return createJwt(payload, secret, expiresInSeconds);
}

export function hashToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function safeEqualHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
