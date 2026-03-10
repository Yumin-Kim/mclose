import { Module } from '@nestjs/common';
import { AwsSesService } from './aws-ses.service';

@Module({
  exports: [AwsSesService],
  providers: [AwsSesService],
})
export class AwsSesModule {}
