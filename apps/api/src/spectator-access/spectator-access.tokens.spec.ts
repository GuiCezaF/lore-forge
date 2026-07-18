import {
  createSpectatorToken,
  hashSpectatorToken,
  isSpectatorToken,
} from './spectator-access.tokens';

describe('spectator access tokens', () => {
  it('creates a 256-bit base64url token with the required prefix', () => {
    const token = createSpectatorToken();

    expect(token).toMatch(/^lfs_[A-Za-z0-9_-]{43}$/);
    expect(isSpectatorToken(token)).toBe(true);
  });

  it('rejects malformed tokens', () => {
    expect(isSpectatorToken('lfs_short')).toBe(false);
    expect(isSpectatorToken('invalid')).toBe(false);
    expect(
      isSpectatorToken('lfs_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa='),
    ).toBe(false);
  });

  it('hashes deterministically without preserving the raw token', () => {
    const token = 'lfs_abcdefghijklmnopqrstuvwxyzABCDEFGHIJK012345';
    const hash = hashSpectatorToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashSpectatorToken(token));
    expect(hash).not.toContain(token);
  });
});
