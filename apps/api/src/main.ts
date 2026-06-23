import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.FRONTEND_BASE_URL ?? 'http://localhost:3001')
      .split(',')
      .map((value) => value.trim()),
    credentials: true,
  });
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
