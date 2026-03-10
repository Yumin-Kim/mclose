import { Module } from '@nestjs/common';
import { ApiExceptionFilter } from './response-exception.filter';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseApiInteceptor } from './response.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseApiInteceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: RenderExceptionFilter,
    // },
    // {
    //   provide: APP_FILTER,
    //   useClass: NotFoundExceptionFilter,
    // },
  ],
  exports: [],
})
export class ResponseModule {}
