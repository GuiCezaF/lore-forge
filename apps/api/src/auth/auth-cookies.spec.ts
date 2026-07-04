import { loadEnvironment } from '../config/environment';
import {
  buildSessionCookieOptions,
  hasSplitOrigins,
  usesCrossSiteCookies,
} from './auth-cookies';

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

describe('auth-cookies', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses lax cookies in development', () => {
    loadTestEnvironment({
      NODE_ENV: 'development',
      API_BASE_URL: 'http://localhost:3000',
      FRONTEND_BASE_URL: 'http://localhost:3001',
    });

    expect(usesCrossSiteCookies()).toBe(false);
    expect(buildSessionCookieOptions(3600)).toMatchObject({
      sameSite: 'lax',
      secure: false,
    });
  });

  it('detects split origins in development when ports differ', () => {
    loadTestEnvironment({
      NODE_ENV: 'development',
      API_BASE_URL: 'http://localhost:3000',
      FRONTEND_BASE_URL: 'http://localhost:3001',
    });

    expect(hasSplitOrigins()).toBe(true);
    expect(usesCrossSiteCookies()).toBe(false);
  });

  it('uses none cookies when frontend and API hosts differ in production', () => {
    loadTestEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: 'production-test-secret-with-32-characters',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      API_BASE_URL: 'https://lore-forge.onrender.com',
      FRONTEND_BASE_URL: 'https://lore-forge-web.vercel.app',
    });

    expect(usesCrossSiteCookies()).toBe(true);
    expect(buildSessionCookieOptions(3600)).toMatchObject({
      sameSite: 'none',
      secure: true,
    });
  });

  it('uses lax cookies when frontend and API share host in production', () => {
    loadTestEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: 'production-test-secret-with-32-characters',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      API_BASE_URL: 'https://loreforge.example.com',
      FRONTEND_BASE_URL: 'https://loreforge.example.com',
    });

    expect(usesCrossSiteCookies()).toBe(false);
    expect(buildSessionCookieOptions(3600)).toMatchObject({
      sameSite: 'lax',
      secure: true,
    });
  });

  it('applies COOKIE_DOMAIN when configured', () => {
    loadTestEnvironment({
      NODE_ENV: 'production',
      JWT_SECRET: 'production-test-secret-with-32-characters',
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      API_BASE_URL: 'https://api.loreforge.example.com',
      FRONTEND_BASE_URL: 'https://app.loreforge.example.com',
      COOKIE_DOMAIN: '.loreforge.example.com',
    });

    expect(buildSessionCookieOptions(3600).domain).toBe(
      '.loreforge.example.com',
    );
  });
});
