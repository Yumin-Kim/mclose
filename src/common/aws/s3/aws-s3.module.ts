import { Module } from '@nestjs/common';
import { AwsS3StorageService } from './aws-s3-storage.service';

@Module({
  providers: [AwsS3StorageService],
  exports: [AwsS3StorageService],
})
export class AwsS3Module {}
