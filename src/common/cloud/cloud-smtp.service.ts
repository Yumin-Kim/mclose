import { Injectable, Logger } from '@nestjs/common';
import * as nodeMailer from 'nodemailer';
import { IGoogleNodeMailerResponse } from './cloud.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudSmtpService {
  private senderEmail: string;
  private userName: string;
  private password: string;
  private smtpHost: string;
  private smtpPort: number;
  private smtpBrandName: string;

  constructor(private configService: ConfigService) {
    this.userName = configService.get<string>('GOOGLE_SMTP_USER');
    this.password = configService.get<string>('GOOGLE_SMTP_PASSWORD');
    this.senderEmail = configService.get<string>('GOOGLE_SMTP_SENDER_EMAIL');
    this.smtpHost = configService.get<string>('GOOGLE_SMTP_HOST');
    this.smtpPort = configService.get<number>('GOOGLE_SMTP_PORT');
    this.smtpBrandName = configService.get<string>('GOOGLE_SMTP_BRAND_NAME');
  }
  // ltpz onft blsr lhbq
  async sendEmail(
    receiverEmail: string,
    subject: string,
    htmlTemplate: string,
  ): Promise<Error | IGoogleNodeMailerResponse> {
    const smtpTransport = nodeMailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      requireTLS: true,
      auth: {
        user: this.userName,
        pass: this.password,
      },
    });

    const mailOptions = {
      from: this.senderEmail,
      to: receiverEmail,
      subject,
      html: htmlTemplate,
    };

    const smtpResult = await new Promise<null | IGoogleNodeMailerResponse>(
      (res, rej) => {
        smtpTransport.sendMail(
          mailOptions,
          (error: Error, info: nodeMailer.SentMessageInfo) => {
            if (error) {
              Logger.error(
                `Email sent error :${error.message}`,
                'CloudSmtpService',
              );
              rej(null);
            } else {
              Logger.log(`Email sent: ${info.response}`, 'CloudSmtpService');
              res(info);
            }
          },
        );
      },
    );

    return smtpResult;
  }
}
