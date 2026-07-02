import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvironment } from './config/environment';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const environment = loadEnvironment();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: environment.FRONTEND_BASE_URL.split(',').map((value) =>
      value.trim(),
    ),
    credentials: true,
  });
  setupSwagger(app);

  await app.listen(environment.PORT);
}
bootstrap();
