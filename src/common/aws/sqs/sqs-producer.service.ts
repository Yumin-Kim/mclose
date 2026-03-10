import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsProducerService {
  private readonly logger = new Logger(SqsProducerService.name);
  private readonly awsConfig: any = {};
  private sqsClient = null;

  constructor(private configService: ConfigService) {
    this.awsConfig.accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY');
    this.awsConfig.secretAccessKey =
      this.configService.get<string>('AWS_SECRET_KEY');
    this.awsConfig.region = this.configService.get<string>('AWS_REGION');

    this.sqsClient = null;

    this.init();
  }

  init() {
    try {
      if (this.sqsClient) return this.sqsClient;

      const sqsClient = new SQSClient({
        credentials: {
          accessKeyId: this.awsConfig.accessKeyId,
          secretAccessKey: this.awsConfig.secretAccessKey,
        },
        region: this.awsConfig.region,
      });

      if (!sqsClient) {
        this.logger.error('Failed to initialize SQS client');
        return null;
      }

      this.logger.log('SQS client initialized');
      this.sqsClient = sqsClient;
    } catch (error) {
      this.logger.error('Failed to initialize SQS client');
      console.log(error);
    }
  }

  close() {
    if (this.sqsClient) {
      this.sqsClient.destroy();
      this.sqsClient = null;
    }
  }

  async produce(
    queueUrl: string,
    message: any,
    messageGroupId: string | null = null,
  ) {
    const queuePrefix = new URL(queueUrl).pathname.split('/').pop();
    try {
      if (!this.sqsClient) {
        this.logger.error(`[${queuePrefix}] SQS client not initialized`);
        return;
      }
      let command = null;

      if (!messageGroupId) {
        command = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
        });
      } else {
        command = new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
          MessageGroupId: messageGroupId,
        });
      }

      const { MessageId } = await this.sqsClient.send(command);

      this.logger.log(
        `[${queuePrefix}] Message sent (MessageId : ${MessageId})`,
      );
      return MessageId;
    } catch (e) {
      this.logger.error(`[${queuePrefix}] Failed to send message`);
      console.log(e);
      return null;
    }
  }
}
