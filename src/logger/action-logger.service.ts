import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppLogger } from './app-logger.service';

export class ActionLoggerInterceptor implements NestInterceptor {
  logger: AppLogger;
  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map(result => {
        // when a request is successfully handled, we add details to DataDog
        const httpContext = context.switchToHttp();
        const req = httpContext.getRequest();
        const actionDetails = {
          req: {
            user: req.user,
            path: req.path,
            method: req.method,
            query: req.query,
            body: req.body,
          },
          res: {
            statusCode: null,
            body: null,
          },
        };
        const res = httpContext.getResponse();
        actionDetails.res.statusCode = res.statusCode;
        actionDetails.res.body = result;
        this.logger.log(actionDetails);
        return result;
      }),
    );
  }
}
