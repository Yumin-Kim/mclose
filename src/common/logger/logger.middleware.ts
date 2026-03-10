import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const appName: string =
      (this.configService.get('LOG_DIR_NAME') as string) ?? 'DEFAULT';

    const logger = new Logger(appName);
    const { ip, method, baseUrl } = request;
    const userAgent = request.get('user-agent') || '';

    // reponse interceptor와 동일한 역할함
    // response.on('close', () => {
    //   const { statusCode } = response;
    //   const contentLength = response.get('content-length');
    // logger.log(
    //   `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
    // );
    // });
    logger.log(`${method} ${baseUrl} - userAgent:${userAgent} - ip:${ip}`);

    next();
  }
}
