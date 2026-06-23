import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { setupSwagger } from '../src/swagger';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../src/auth/auth.constants';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let authService: AuthService;
  let usersService: UsersService;

  const googleProfile = {
    sub: 'e2e-google-subject',
    email: 'e2e@loreforge.test',
    name: 'E2E Player',
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();

    authService = moduleFixture.get(AuthService);
    usersService = moduleFixture.get(UsersService);
  });

  afterEach(async () => {
    await app.close();
  });

  function createSession() {
    const user = usersService.upsertGoogleUser(googleProfile);
    return authService.createSession(user);
  }

  describe('protected routes', () => {
    it('/auth/me (GET) returns 401 without token', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('/users/me (GET) returns 401 without token', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('/auth/me (GET) returns authenticated user with bearer token', async () => {
      const session = createSession();

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(googleProfile.email);
      expect(response.body.id).toBeDefined();
    });

    it('/users/me (GET) returns public profile with access cookie', async () => {
      const session = createSession();

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', `${ACCESS_TOKEN_COOKIE}=${session.accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(googleProfile.email);
      expect(response.body).not.toHaveProperty('tokenVersion');
    });
  });

  describe('session rotation', () => {
    it('/auth/refresh (POST) rotates cookies and returns user', async () => {
      const session = createSession();

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`)
        .expect(200);

      expect(response.body.email).toBe(googleProfile.email);
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`${ACCESS_TOKEN_COOKIE}=`),
          expect.stringContaining(`${REFRESH_TOKEN_COOKIE}=`),
        ]),
      );
    });

    it('/auth/refresh (POST) returns 401 without refresh cookie', () => {
      return request(app.getHttpServer()).post('/auth/refresh').expect(401);
    });
  });

  describe('logout', () => {
    it('/auth/logout (POST) revokes session and clears cookies', async () => {
      const session = createSession();

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_COOKIE}=${session.refreshToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(401);
    });
  });

  describe('google login entrypoint', () => {
    it('/auth/google (GET) redirects to Google OAuth', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);

      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([
          expect.stringContaining('loreforge_oauth_state='),
        ]),
      );
    });
  });
});
