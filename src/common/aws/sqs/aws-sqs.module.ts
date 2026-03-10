import { Module } from '@nestjs/common';
import { SqsConsumerService } from './sqs-consumer.service';
import { SqsProducerService } from './sqs-producer.service';

@Module({
  imports: [],
  providers: [SqsConsumerService, SqsProducerService],
  exports: [SqsConsumerService, SqsProducerService],
})
export class AwsSqsModule {}
