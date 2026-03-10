import { Module } from '@nestjs/common';
import { CloudSmtpService } from './cloud-smtp.service';
import { CloudStorageService } from './cloud-storage.service';

@Module({
  providers: [CloudSmtpService, CloudStorageService],
  exports: [CloudSmtpService, CloudStorageService],
})
export class CloudModule {}
