import {
  createPkceCodeChallenge,
  createPkceCodeVerifier,
  signOAuthState,
  verifyOAuthState,
} from './oauth-state';
import { SignedOAuthState } from './auth.types';

const SECRET = 'test-oauth-secret';

describe('oauth-state', () => {
  const validState: SignedOAuthState = {
    state: 'oauth-state-id',
    codeVerifier: createPkceCodeVerifier(),
    createdAt: new Date().toISOString(),
  };

  describe('PKCE', () => {
    it('generates deterministic code challenge from verifier', () => {
      const verifier = 'fixed-code-verifier-value';
      const challenge = createPkceCodeChallenge(verifier);

      expect(challenge).toBe(createPkceCodeChallenge(verifier));
      expect(challenge).not.toBe(verifier);
    });

    it('generates unique code verifiers', () => {
      expect(createPkceCodeVerifier()).not.toBe(createPkceCodeVerifier());
    });
  });

  describe('signOAuthState / verifyOAuthState', () => {
    it('round-trips signed OAuth state', () => {
      const token = signOAuthState(validState, SECRET);
      const parsed = verifyOAuthState(token, SECRET);

      expect(parsed).toEqual(validState);
    });

    it('rejects tampered signature', () => {
      const token = signOAuthState(validState, SECRET);
      const tampered = `${token}x`;

      expect(() => verifyOAuthState(tampered, SECRET)).toThrow(
        'Invalid OAuth state signature',
      );
    });

    it('rejects expired OAuth state', () => {
      const expiredState: SignedOAuthState = {
        ...validState,
        createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
      };
      const token = signOAuthState(expiredState, SECRET);

      expect(() => verifyOAuthState(token, SECRET)).toThrow(
        'OAuth state expired',
      );
    });
  });
});
