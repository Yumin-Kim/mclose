import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsSesService {
  private readonly logger = new Logger(AwsSesService.name);
  private readonly awsConfig: any = {};
  private sesClient: SESClient | null;
  constructor(private configService: ConfigService) {
    this.awsConfig.accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY');
    this.awsConfig.secretAccessKey =
      this.configService.get<string>('AWS_SECRET_KEY');
    this.awsConfig.region = this.configService.get<string>('AWS_REGION');

    this.sesClient = null;
  }

  private getSesClient() {
    if (this.sesClient) return this.sesClient;

    const sesClient = new SESClient({
      credentials: {
        accessKeyId: this.awsConfig.accessKeyId,
        secretAccessKey: this.awsConfig.secretAccessKey,
      },
      region: this.awsConfig.region,
    });

    this.sesClient = sesClient;

    return sesClient;
  }

  close() {
    if (this.sesClient) {
      this.sesClient.destroy();
      this.sesClient = null;
    }
  }

  async sendEmail(
    from: string,
    to: string | string[],
    subject: string,
    body: string,
    cc?: string,
    bcc?: string,
  ) {
    const sesClient = this.getSesClient();
    const params = {
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
        CcAddresses: cc ? [cc] : [],
        BccAddresses: bcc ? [bcc] : [],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: from,
    };

    try {
      const sendCommand = new SendEmailCommand(params);
      const data = await sesClient.send(sendCommand);
      this.logger.log(`Email sent: ${data.MessageId}`);
      return data;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async sendEmailWithAttachment(
    to: string,
    subject: string,
    body: string,
    from: string,
    attachment: any,
    cc?: string,
    bcc?: string,
  ) {
    const sesClient = this.getSesClient();
    const params = {
      Destination: {
        CcAddresses: cc ? [cc] : [],
        ToAddresses: [to],
        BccAddresses: bcc ? [bcc] : [],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: from,
      Attachments: [
        {
          Name: attachment.name,
          Data: attachment.data,
        },
      ],
    };

    try {
      const sendCommand = new SendEmailCommand(params);
      const data = await sesClient.send(sendCommand);
      this.logger.log(`Email sent: ${data.MessageId}`);
      return data;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}
