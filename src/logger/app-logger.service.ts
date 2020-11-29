import { createLogger, format, transports } from 'winston';
import { Logger } from '@nestjs/common';

const consoleTransport = new transports.Console({
  level: 'info',
});
const appTransports: any[] = [consoleTransport];

// if we are in production, we also use datadog
const production =
  process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';
if (production) {
  const ddtransport = new transports.Http({
    host: 'http-intake.logs.datadoghq.com',
    path:
      '/v1/input/da9eefc18cdbe0226878dd00ff0f6dce?ddsource=nodejs&service=digituz',
    ssl: true,
  });
  appTransports.push(ddtransport);
}

// creates Winston's logger with the transports defined
const logger = createLogger({
  level: 'info',
  exitOnError: false,
  format: format.json(),
  transports: appTransports,
});

// extends Nest.js' Logger to use Winston
export class AppLogger extends Logger {
  log(message: string) {
    logger.log('info', message);
  }

  error(message: string) {
    logger.error(message);
  }

  warn(message: string) {
    logger.warn(message);
  }

  debug(message: string) {
    logger.debug(message);
  }

  verbose(message: string) {
    logger.verbose(message);
  }
}
