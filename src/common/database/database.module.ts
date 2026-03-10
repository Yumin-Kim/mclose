import { Module } from '@nestjs/common';
import { TypeOrmOptiosSerivce } from './typeorm.options.service';

@Module({
  providers: [TypeOrmOptiosSerivce],
  exports: [TypeOrmOptiosSerivce],
})
export class DatabaseOptionsModule {}
