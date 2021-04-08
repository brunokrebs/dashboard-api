import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppLogger } from './logger/app-logger.service';
import fetch from 'node-fetch';

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

    const formatedMessage = {
      text: 'Falha em Digituz Dashboard API',
      attachments: [
        {
          text: `Houve erro inesperado ao executar uma requisição`,
          fallback: 'Não a erro',
          callback_id: 'wopr_game',
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [
            {
              name: 'goDatadog',
              text: 'Ir para os logs do datadog',
              style: 'danger',
              type: 'button',
              value: 'war',
              url: 'https://app.datadoghq.com/logs?index=%2A&query=',
            },
          ],
        },
      ],
    };

    try {
      fetch(process.env.ERROR_CHANNEL, {
        mode: 'no-cors',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(formatedMessage),
      })
        .then(() => console.log('sucesso'))
        .catch(err => console.log(err));
    } catch (err) {
      console.log(err);
    }
  }
}
