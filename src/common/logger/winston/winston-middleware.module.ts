import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import {
  WinstonHttpMiddleware,
  WinstonHttpResponseMiddleware,
  WinstonHttpWriteIntoConsoleMiddleware,
  WinstonHttpWriteIntoFileMiddleware,
} from './winston.middleware';
import { WinstonHelperDateService } from './winston-helper.service';

@Module({
  providers: [WinstonHelperDateService],
})
export class WinstonMiddlewareModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        WinstonHttpResponseMiddleware,
        WinstonHttpMiddleware,
        WinstonHttpWriteIntoConsoleMiddleware,
        WinstonHttpWriteIntoFileMiddleware,
      )
      .forRoutes('*');
  }
}
