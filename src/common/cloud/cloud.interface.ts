import { FileMetadata } from '@google-cloud/storage';
import * as nodeMailer from 'nodemailer';

export interface IGoogleNodeMailerResponse extends nodeMailer.SentMessageInfo {
  accepted: Array<string>;
  rejected: Array<any>;
  ehlo: Array<string>;
  envelopeTime: number;
  messageTime: number;
  messageSize: number;
  response: string;
  envelope: IGoogleNodeMailerEnvelope;
  messageId: string;
}

export interface IGoogleNodeMailerEnvelope {
  from: string;
  to: Array<string>;
}

export interface IGoolgeStorageResponse extends FileMetadata {
  publicUrl: string;
}
