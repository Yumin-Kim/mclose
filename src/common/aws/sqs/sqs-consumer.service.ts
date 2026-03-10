/**
 * // {
 * //   Body: "{\"width\":\"640\",\"nickname\":\"360\",\"question\":\"질문1\"}",
 * //   MD5OfBody: "e228d118e393104f719f203344c6448c",
 * //   MessageId: "493f0f55-7e65-4d3d-a769-b01ba77b7abc",
 * //   ReceiptHandle: "AQEBAv0f0rJckgl3w6vxxaUUgwhDXo/XiMkqeOgOyK7sRAaOqHS0kqRlVfqyswHSY9ItAldvXiGUA2rZiZPSdAtpPfGa8Cd477zppz+b5KCotQYCEJ3rzHFfyjsIv6jZDYDZP/6/Wk7P2vr5/Tk/YC0AodWpCfC1b7gMjUyldTeysHfrx9U3y3UZKWLBJDfA1+vDH/BnxZy+zKr1kpcxI6+tj/1xs+5FHKzSxio/dQ/p8AvUO/z1ADRwOCLArtzm5OrpSrNzvLId1YmdgW2aFnEdsAqCug8zHX26Z/LT4m33nEHOwjUYEJQ1Vkwr8NdLTR1TtromCTlCJjkAewk1IRUnqNwohxQholziv1HPQmRIRa1wCDDVPCHSr0FhI999+kOYDzz6jGpyIQC5T5qwtkQjsQ==",
 * // }
 */
import {
  DeleteMessageBatchCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsConsumerService {
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly awsConfig: any = {};
  private readonly SQS_CONSUMER_WAIT_TIME = 2;
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
    } catch (e) {
      this.logger.error('Failed to initialize SQS client');
      console.log(e);
    }
  }

  close() {
    if (this.sqsClient) {
      this.sqsClient.destroy();
      this.sqsClient = null;
    }
  }

  async consume(
    queueUrl: string,
    callback: (message: any) => any,
    isNotWhile: boolean = false,
  ) {
    const queuePrefix = new URL(queueUrl).pathname.split('/').pop();

    try {
      if (!this.sqsClient) {
        this.logger.error(`[${queuePrefix}] SQS client not initialized`);
        return;
      }

      // long polling
      while (true) {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: this.SQS_CONSUMER_WAIT_TIME,
        });

        const { Messages } = await this.sqsClient.send(command);

        if (Messages && Messages.length > 0) {
          this.logger.log(
            `[${queuePrefix}] Message received (MessageId : ${Messages[0].MessageId})`,
          );
          const message = Messages[0];
          const { Body, ReceiptHandle } = message;
          // callback function Promise Function or not
          const result = callback(JSON.parse(Body));
          if (result instanceof Promise) {
            await result;
          }

          const deleteCommand = new DeleteMessageCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: ReceiptHandle,
          });

          await this.sqsClient.send(deleteCommand);

          this.logger.log(
            `[${queuePrefix}] Message deleted (MessageId : ${message.MessageId})`,
          );

          if (isNotWhile) {
            return result;
          }
        } else {
          this.logger.debug(`[${queuePrefix}] No message received`);
          if (isNotWhile) {
            return null;
          }
        }
      }
    } catch (e) {
      this.logger.error(`[${queuePrefix}] Failed to consume message`);
      console.log(e);
    }
  }

  async batchConsume(queueUrl: string, callback: (messages: any[]) => any) {
    const queuePrefix = new URL(queueUrl).pathname.split('/').pop();

    try {
      if (!this.sqsClient) {
        this.logger.error(`[${queuePrefix}] SQS client not initialized`);
        return;
      }

      // long polling
      while (true) {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: this.SQS_CONSUMER_WAIT_TIME,
        });

        const { Messages } = await this.sqsClient.send(command);

        if (Messages && Messages.length > 0) {
          this.logger.log(
            `[${queuePrefix}] Messages received: ${Messages.map((m) => m.MessageId)}`,
          );
          const messages = Messages.map((message) => JSON.parse(message.Body));

          // callback function Promise Function or not
          const result = callback(messages);
          if (result instanceof Promise) {
            await result;
          }

          const deleteCommand = new DeleteMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: Messages.map((message) => ({
              Id: message.MessageId,
              ReceiptHandle: message.ReceiptHandle,
            })),
          });

          await this.sqsClient.send(deleteCommand);

          this.logger.log(
            `[${queuePrefix}] Messages deleted: ${Messages.map((m) => m.MessageId)}`,
          );
        } else {
          this.logger.debug(`[${queuePrefix}] No message received`);
        }
      }
    } catch (e) {
      this.logger.error(`[${queuePrefix}] Failed to consume message`);
      console.log(e);
    }
  }

  // FIFO Queue 필수
  async consumeByCommandUuid<T>(
    commandUUID: string,
    queueUrl: string,
    callback: (message: any) => Promise<T>,
  ) {
    const queuePrefix = new URL(queueUrl).pathname.split('/').pop();
    try {
      if (!this.sqsClient) {
        this.logger.error(`[${queuePrefix}] SQS client not initialized`);
        return;
      }

      while (true) {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: this.SQS_CONSUMER_WAIT_TIME,
        });

        const { Messages } = await this.sqsClient.send(command);

        if (Messages && Messages.length > 0) {
          const message = Messages[0];
          const { Body, ReceiptHandle } = message;

          const messageBody = JSON.parse(Body);
          if (messageBody.commandUUID === commandUUID) {
            this.logger.log(
              `[${queuePrefix}] CommandUUID: ${commandUUID} Message received: ${message.MessageId}`,
            );

            // callback function Promise Function or not
            const result = await callback(messageBody);

            const deleteCommand = new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: ReceiptHandle,
            });

            await this.sqsClient.send(deleteCommand);
            this.logger.log(
              `[${queuePrefix}] Message deleted: ${message.MessageId}`,
            );

            return result;
          } else {
            this.logger.log(
              `[${queuePrefix}] MessageId not found While waiting for message`,
            );
          }
        } else {
          this.logger.debug(
            `[${queuePrefix}] No message received OR MessageId not found`,
          );
        }
      }
    } catch (e) {
      this.logger.error(`[${queuePrefix}] Failed to consume message`);
      console.log(e);
      return null;
    }
  }

  async flush(queueUrl: string, size: number) {
    const queuePrefix = new URL(queueUrl).pathname.split('/').pop();
    try {
      if (!this.sqsClient) {
        this.logger.error(`[${queuePrefix}] SQS client not initialized`);
        return;
      }

      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: size,
      });

      const { Messages } = await this.sqsClient.send(command);

      if (Messages && Messages.length > 0) {
        this.logger.log(
          `[${queuePrefix}] Messages received: ${Messages.map((m) => m.MessageId)}`,
        );
        // callback function Promise Function or not
        const deleteCommand = new DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: Messages.map((message) => ({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
          })),
        });

        await this.sqsClient.send(deleteCommand);

        this.logger.log(
          `[${queuePrefix}] Messages deleted: ${Messages.map((m) => m.MessageId)}`,
        );
      } else {
        this.logger.debug(`[${queuePrefix}] FLUSH: No message received`);
      }
    } catch (e) {
      this.logger.error('Failed to flush message');
      console.log(e);
    }
  }
}
