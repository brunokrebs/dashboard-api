import { ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';

export async function bootstrap(silentMode = false) {
  const logger: LogLevel[] = ['error', 'warn'];
  if (!silentMode) {
    logger.push('log');
    process.env.LOG_SQL_QUERIES = 'true';
  }

  const app = await NestFactory.create(AppModule, { logger });
  app.use(helmet());

  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.NODE_ENV !== 'test'
  ) {
    console.log('Enabling CORS for https://dashboard.digituz.com.br');
    app.enableCors({
      origin: 'https://dashboard.digituz.com.br',
    });
  }
  console.log(`NODE_ENV = ${process.env.NODE_ENV}`);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('v1');
  await app.listen(3005);
  return app;
}
