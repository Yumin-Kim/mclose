/**
 * Module to create a custom logger with Winston
 * Write logs to the console and file
 */
import {
  DynamicModule,
  ForwardReference,
  Global,
  Module,
  Provider,
  Type,
} from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { WinstonService } from './winston/winston.service';
import { WinstonOptionService } from './winston/winston.options.service';
import { WinstonMiddlewareModule } from './winston/winston-middleware.module';
import { DebuggerOptionsModule } from './winston/winston-options.module';

@Global()
@Module({})
export class CustomWinstonModule {
  static forRoot(): DynamicModule {
    const providers: Provider<any>[] = [];
    const imports: (
      | DynamicModule
      | Type<any>
      | Promise<DynamicModule>
      | ForwardReference<any>
    )[] = [];

    providers.push(WinstonService);
    imports.push(
      WinstonModule.forRootAsync({
        inject: [WinstonOptionService],
        imports: [DebuggerOptionsModule],
        useFactory: (winstonOptionService: WinstonOptionService) =>
          winstonOptionService.createLogger(),
      }),
    );

    return {
      module: CustomWinstonModule,
      providers,
      exports: providers,
      controllers: [],
      imports: [...imports, WinstonMiddlewareModule],
    };
  }
}
