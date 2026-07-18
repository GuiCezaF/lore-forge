import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('LoreForge API')
    .setDescription('Public REST API for LoreForge')
    .setVersion('0.0.1')
    .addBearerAuth()
    .addTag('app')
    .addTag('auth')
    .addTag('users')
    .addTag('campaigns')
    .addTag('characters')
    .addTag('monsters')
    .addTag('items')
    .addTag('media')
    .addTag('spectator-access')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
