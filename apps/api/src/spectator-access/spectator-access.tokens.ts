import { createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'lfs_';
const TOKEN_PATTERN = /^lfs_[A-Za-z0-9_-]{43}$/;

export function createSpectatorToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
}

export function isSpectatorToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

export function hashSpectatorToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
