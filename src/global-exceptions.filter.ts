import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLogger } from './logger/app-logger.service';
import { sendSlackAlert } from './util/slack-alert';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  logger: AppLogger;
  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    // when a request fails, we add details to DataDog and send Alert to Slack
    this.logger.error({
      req: {
        user: request.user,
        path: request.path,
        method: request.method,
        query: request.query,
        body: request.body,
      },
      res: {
        statusCode: status,
      },
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    sendSlackAlert();
  }
}
