import { loadEnvironment } from '../config/environment';
import { buildHandoffToken, verifyHandoffToken } from './auth-handoff';

const baseEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/loreforge',
  REDIS_URL: 'redis://localhost:6379',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'loreforge',
  S3_ACCESS_KEY: 'minioadmin',
  S3_SECRET_KEY: 'minioadmin',
};

function loadTestEnvironment(
  overrides: Record<string, string | undefined>,
): void {
  for (const [key, value] of Object.entries({ ...baseEnv, ...overrides })) {
    if (value === undefined) {
      delete process.env[key];
      continue;
    }
    process.env[key] = value;
  }

  loadEnvironment({
    reload: true,
    envFilePath: '/dev/null',
  });
}

describe('auth-handoff', () => {
  const originalEnv = process.env;
  const secret = 'production-test-secret-with-32-characters';

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates and verifies a handoff token with session tokens', () => {
    loadTestEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: secret,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      API_BASE_URL: 'https://lore-forge.onrender.com',
      FRONTEND_BASE_URL: 'https://lore-forge-web.vercel.app',
    });

    const session = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const handoffToken = buildHandoffToken(session, secret);
    const claims = verifyHandoffToken(handoffToken, secret);

    expect(claims.accessToken).toBe(session.accessToken);
    expect(claims.refreshToken).toBe(session.refreshToken);
    expect(claims.jti).toBeTruthy();
  });
});
