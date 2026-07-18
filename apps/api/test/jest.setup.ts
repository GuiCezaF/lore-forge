const testEnvironment: Record<string, string> = {
  NODE_ENV: 'test',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  GOOGLE_OAUTH_REDIRECT_URI: 'http://localhost:3000/auth/google/callback',
  JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-deterministic-tests',
  DATABASE_URL:
    'postgresql://loreforge:loreforge@localhost:5432/loreforge_test',
  REDIS_URL: 'redis://localhost:6379',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_BUCKET: 'loreforge-test',
  S3_ACCESS_KEY: 'test-access-key',
  S3_SECRET_KEY: 'test-secret-key',
  S3_REGION: 'us-east-1',
};

for (const [key, value] of Object.entries(testEnvironment)) {
  if (!process.env[key]?.trim()) process.env[key] = value;
}
