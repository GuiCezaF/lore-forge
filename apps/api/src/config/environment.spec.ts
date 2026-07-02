import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('applies defaults and derives the post-login redirect URL', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/loreforge',
      REDIS_URL: 'redis://localhost:6379',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_BUCKET: 'loreforge',
      S3_ACCESS_KEY: 'minioadmin',
      S3_SECRET_KEY: 'minioadmin',
    });

    expect(environment.NODE_ENV).toBe('development');
    expect(environment.PORT).toBe(3000);
    expect(environment.API_BASE_URL).toBe('http://localhost:3000');
    expect(environment.FRONTEND_BASE_URL).toBe('http://localhost:3001');
    expect(environment.POST_LOGIN_REDIRECT_URL).toBe('http://localhost:3001');
    expect(environment.S3_REGION).toBe('us-east-1');
  });

  it('requires Google OAuth credentials and a strong JWT secret in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/loreforge',
        REDIS_URL: 'redis://localhost:6379',
        S3_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
        S3_BUCKET: 'loreforge',
        S3_ACCESS_KEY: 'r2-access-key',
        S3_SECRET_KEY: 'r2-secret-key',
        JWT_SECRET: 'short-secret',
      }),
    ).toThrow(
      /GOOGLE_CLIENT_ID is required in production|GOOGLE_CLIENT_SECRET is required in production|JWT_SECRET must be set to a non-default value/,
    );
  });
});
