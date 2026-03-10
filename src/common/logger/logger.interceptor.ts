import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ConfigService } from '@nestjs/config';

// response logging
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  constructor(private configService: ConfigService) {}

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
              const resBody = Buffer.byteLength(JSON.stringify(data));
              this.logger.debug(`Content-Length: ${resBody} byte`);
            }

            this.logger.log(`${method} ${url} ${Date.now() - now}ms `);
          },
          error: (error) => {
            this.logger.debug(
              ` response:${JSON.stringify(error)} ${Date.now() - now}ms `,
            );
            this.logger.error(`${method} ${url} ${Date.now() - now}ms`);
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
