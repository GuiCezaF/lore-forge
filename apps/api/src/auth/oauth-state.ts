import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { SignedOAuthState } from './auth.types';

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

export function createPkceCodeVerifier(): string {
  return randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
}

export function createPkceCodeChallenge(codeVerifier: string): string {
  return base64UrlEncode(createHash('sha256').update(codeVerifier).digest());
}

export function signOAuthState(
  state: SignedOAuthState,
  secret: string,
): string {
  const payload = base64UrlEncode(JSON.stringify(state));
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyOAuthState(
  token: string,
  secret: string,
): SignedOAuthState {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    throw new Error('Malformed OAuth state');
  }

  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error('Invalid OAuth state signature');
  }

  const parsed = JSON.parse(
    base64UrlDecode(payload).toString('utf8'),
  ) as SignedOAuthState;
  if (!parsed.state || !parsed.codeVerifier || !parsed.createdAt) {
    throw new Error('Invalid OAuth state payload');
  }

  const ageMs = Date.now() - Date.parse(parsed.createdAt);
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) {
    throw new Error('OAuth state expired');
  }

  return parsed;
}
