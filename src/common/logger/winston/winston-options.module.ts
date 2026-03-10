import { Module } from '@nestjs/common';
import { WinstonOptionService } from './winston.options.service';

@Module({
  providers: [WinstonOptionService],
  exports: [WinstonOptionService],
  imports: [],
})
export class DebuggerOptionsModule {}
