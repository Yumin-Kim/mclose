import { Injectable, Logger } from '@nestjs/common';
import { SqsConsumerService } from '../../common/aws/sqs/sqs-consumer.service';
import { SqsProducerService } from '../../common/aws/sqs/sqs-producer.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppDaemonService {
  private readonly logger = new Logger(AppDaemonService.name);
  private readonly videoTransformOutQueueUrl: string;
  private daemonMap = new Map<string, any>();

  constructor(
    private readonly sqsConsumerService: SqsConsumerService,
    private readonly sqsProducerService: SqsProducerService,
    private readonly configService: ConfigService,
  ) {
    this.videoTransformOutQueueUrl = this.configService.get<string>(
      'AWS_SQS_VIDEO_TRANSFORM_OUT_QUEUE_URL',
    );
    this.init();
  }
  init() {
    this.logger.log('App Daemon Service initialized');
    setTimeout(() => {
      this.execute(this.videoTransformOutQueueUrl);
    }, 1000);
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

  execute(queueUrl) {
    try {
      this.logger.log(
        'App Daemon Service is running. Waiting for the message from queue',
      );

      this.sqsConsumerService.consume(queueUrl, (message) => {
        const { commandUUID } = message;
        this.logger.log(
          `Received message from queue: commandUUID ${commandUUID}`,
        );
        const endTime = new Date().getTime();
        const startTime = this.daemonMap.get(commandUUID).timestamp;
        const diff = this.diffTime(startTime, endTime);

        this.daemonMap.delete(commandUUID);

        this.logger.log(
          `Start to execute daemon for commandUUID : ${commandUUID}`,
        );
        this.logger.log(`Execution time: ${diff} seconds`);
      });
    } catch (error) {
      this.logger.error('Failed to execute daemon');
      console.log(error);
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
