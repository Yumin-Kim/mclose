import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { WinstonService } from './winston.service';

@Injectable()
export class WinstonLoggerInterceptor implements NestInterceptor {
  constructor(
    private configService: ConfigService,
    private loggerService: WinstonService,
  ) {}

  // interceptor method
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    if (req) {
      const method = req.method;
      const url = req.url;
      return next.handle().pipe(
        tap({
          next: (data) => {
            // content-length logging
            if (data) {
              const resBodyByte = Buffer.byteLength(JSON.stringify(data));
              this.loggerService.debug(
                req.requestId,
                {
                  description: `Content-Length: ${resBodyByte} byte`,
                  class: 'WinstonLoggerInterceptor',
                  function: 'intercept',
                  path: 'WinstonLoggerInterceptor',
                },
                data,
              );
            }
            this.loggerService.info(
              req.requestId,
              {
                description: ` response:${JSON.stringify(data)} ${
                  Date.now() - now
                }ms `,
                function: 'intercept.next',
                class: 'WinstonLoggerInterceptor',
                path: `${method} : ${url}`,
              },
              data,
            );
          },
          error: (error) => {
            this.loggerService.error(
              req.requestId,
              {
                description: ` response:${JSON.stringify(error)} ${
                  Date.now() - now
                }ms `,
                class: 'WinstonLoggerInterceptor',
                function: 'intercept.error',
                path: `${method} : ${url}`,
              },
              error,
            );
          },
        }),
      );
    } else {
      // GRAPHQL interception
      return next
        .handle()
        .pipe(tap(() => Logger.log(` ${Date.now() - now}ms`)));
    }
  }
}
