import {
  buildAccessToken,
  buildRefreshToken,
  createJwt,
  hashToken,
  safeEqualHash,
  verifyJwt,
} from './jwt';
import { AccessTokenClaims, RefreshTokenClaims } from './auth.types';

const SECRET = 'test-jwt-secret';

describe('jwt', () => {
  const accessClaims: AccessTokenClaims = {
    sub: 'user-1',
    email: 'player@loreforge.test',
    name: 'Player',
    role: 'user',
    plan: 'free',
    tokenVersion: 0,
  };

  const refreshClaims: RefreshTokenClaims = {
    sub: 'user-1',
    tokenVersion: 0,
    jti: 'refresh-id',
  };

  describe('createJwt / verifyJwt', () => {
    it('round-trips access token claims', () => {
      const token = createJwt(accessClaims, SECRET, 3600);
      const decoded = verifyJwt<AccessTokenClaims>(token, SECRET);

      expect(decoded.sub).toBe(accessClaims.sub);
      expect(decoded.email).toBe(accessClaims.email);
      expect(decoded.tokenVersion).toBe(accessClaims.tokenVersion);
    });

    it('rejects token signed with another secret', () => {
      const token = createJwt(accessClaims, SECRET, 3600);

      expect(() => verifyJwt(token, 'other-secret')).toThrow('Invalid signature');
    });

    it('rejects expired token', () => {
      const token = createJwt(accessClaims, SECRET, -1);

      expect(() => verifyJwt(token, SECRET)).toThrow('Token expired');
    });

    it('rejects malformed token', () => {
      expect(() => verifyJwt('invalid.token', SECRET)).toThrow('Malformed token');
    });
  });

  describe('buildAccessToken / buildRefreshToken', () => {
    it('builds verifiable access token', () => {
      const token = buildAccessToken(accessClaims, SECRET, 3600);
      expect(verifyJwt<AccessTokenClaims>(token, SECRET).sub).toBe('user-1');
    });

    it('builds verifiable refresh token', () => {
      const token = buildRefreshToken(refreshClaims, SECRET, 3600);
      expect(verifyJwt<RefreshTokenClaims>(token, SECRET).jti).toBe('refresh-id');
    });
  });

  describe('hashToken / safeEqualHash', () => {
    it('produces stable hash for the same input', () => {
      const first = hashToken('refresh-token', SECRET);
      const second = hashToken('refresh-token', SECRET);

      expect(first).toBe(second);
      expect(safeEqualHash(first, second)).toBe(true);
    });

    it('returns false for different hashes', () => {
      const left = hashToken('token-a', SECRET);
      const right = hashToken('token-b', SECRET);

      expect(safeEqualHash(left, right)).toBe(false);
    });
  });
});
