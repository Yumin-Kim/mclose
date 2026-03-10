import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, map, throwError, timeout } from 'rxjs';
import { IApiResponse } from './response-interface';
import { RESPONSE_CODE } from '../../constant';

@Injectable()
export class ResponseApiInteceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req: Request = context.switchToHttp().getRequest();
    const { url } = req;

    return next.handle().pipe(
      timeout(60 * 1000 * 30), // api connection response timeout 1m
      catchError((error) => {
        return throwError(() => error);
      }),
      map((data: any): IApiResponse => {
        if (!data) return;

        return {
          retCode: data.retCode || RESPONSE_CODE.SUCCESS,
          msg: 'OK',
          data,
          command: url.replaceAll('/', '_').slice(1),
        };
      }),

      // tap({
      //   next: (data) => {},
      //   error: (error) => console.log('LecIntercepter error', error),
      // }),
    );
  }
}
