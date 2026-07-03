import { randomBytes } from 'node:crypto';

export function generateShortCode(): string {
  return `lf-${randomBytes(3).toString('hex')}`;
}
