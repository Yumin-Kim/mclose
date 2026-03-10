/**
 * Logger Module
 * NestJS에서 제공하는 Logger를 사용함
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerMiddleware } from './logger.middleware';
import { LoggingInterceptor } from './logger.interceptor';

@Module({
  imports: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class LoggerModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
