import { Injectable, Logger } from '@nestjs/common';
import { SqsConsumerService } from '../../common/aws/sqs/sqs-consumer.service';
import { SqsProducerService } from '../../common/aws/sqs/sqs-producer.service';
import { randomUUID } from 'crypto';
@Injectable()
export class AdminDaemonService {
  private readonly logger = new Logger(AdminDaemonService.name);
  private daemonMap = new Map<string, any>();

  constructor(
    private readonly sqsConsumerService: SqsConsumerService,
    private readonly sqsProducerService: SqsProducerService,
  ) {
    this.init();
  }
  init() {
    this.logger.log('Admin Daemon Service initialized');
  }

  prepareMsg(message: any) {
    const uuid = randomUUID();
    const unixTime = new Date().getTime();
    message.commandUUID = uuid;
    message.timestamp = unixTime;
    return uuid;
  }

  diffTime(startTime: number, endTime: number) {
    const diff = endTime - startTime;
    // convert to seconds
    return diff / 1000;
  }

  async send(
    queueUrl: string,
    message: any,
    MessageGroupId: string | null = null,
  ) {
    try {
      const uuid = this.prepareMsg(message);

      const messageId = await this.sqsProducerService.produce(
        queueUrl,
        message,
        MessageGroupId,
      );
      if (!messageId) {
        this.logger.error('Failed to send message');
        return null;
      }
      this.logger.log('Send Message ID: ' + messageId);

      this.daemonMap.set(uuid, message);

      return uuid;
    } catch (error) {
      this.logger.error('Failed to send message');
      console.log(error);
      return null;
    }
  }

  async sendNotCache(
    queueUrl: string,
    message: any,
    MessageGroupId: string | null = null,
  ) {
    try {
      const uuid = this.prepareMsg(message);

      const messageId = await this.sqsProducerService.produce(
        queueUrl,
        message,
        MessageGroupId,
      );
      if (!messageId) {
        this.logger.error('Failed to send message');
        return null;
      }
      this.logger.log('Send Message ID: ' + messageId);

      return uuid;
    } catch (error) {
      this.logger.error('Failed to send message');
      console.log(error);
      return null;
    }
  }

  isExist(uuid: string) {
    return this.daemonMap.has(uuid);
  }

  async defferedResult<T>(
    inQueueUrl: string,
    outQueueUrl: string,
    message: any,
    callback: any,
  ): Promise<T> {
    try {
      // Send message to SQS
      const commandUUID = await this.send(
        inQueueUrl,
        message,
        'mathcing_group_id',
      );

      // Wait for the result
      const result = await this.sqsConsumerService.consumeByCommandUuid<T>(
        commandUUID,
        outQueueUrl,
        callback,
      );
      if (!result) {
        this.logger.error('Failed to receive message by MessageId');
        return null;
      }

      this.daemonMap.delete(commandUUID);

      return result as T;
    } catch (error) {
      this.logger.error('Failed to receive message by MessageId');
      console.log(error);
    }
  }
}
