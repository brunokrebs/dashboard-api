import { ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './logger/app-logger.service';
import { ActionLoggerInterceptor } from './logger/action-logger.service';
import { GlobalExceptionsFilter } from './global-exceptions.filter';

export async function bootstrap(silentMode = false) {
  if (!silentMode) {
    process.env.LOG_SQL_QUERIES = 'true';
  }

  // supporting transactions
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();

  // build app instance
  const appLogger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger: appLogger });
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
  app.useGlobalFilters(new GlobalExceptionsFilter(appLogger));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new ActionLoggerInterceptor(appLogger));
  app.setGlobalPrefix('v1');
  await app.listen(3005);
  return app;
}
