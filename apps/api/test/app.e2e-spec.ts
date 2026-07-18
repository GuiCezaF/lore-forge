import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from './../src/swagger';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.listen(0);
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'UP' });
  });

  it('/api/docs (GET)', () => {
    return request(app.getHttpServer()).get('/api/docs').expect(200);
  });

  it('/api/docs-json describes protected media without exposing bypass auth', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    expect(response.body.paths['/media/{assetId}/file'].get.security).toEqual([
      { bearer: [] },
    ]);
    expect(
      response.body.paths['/media/{assetId}/file'].get.responses['200'].content[
        'image/*'
      ].schema.format,
    ).toBe('binary');
    expect(response.body.paths['/auth/bypass']).toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
