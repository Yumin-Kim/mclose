import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, readFileSync } from 'fs';
import { Readable } from 'stream';

@Injectable()
export class AwsS3StorageService {
  private logger = new Logger(AwsS3StorageService.name);
  private awsConfig: any = {}; // ConfigType<typeof awsConfig>;
  private s3Client: S3Client | null;

  constructor(private configService: ConfigService) {
    this.awsConfig.accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY');
    this.awsConfig.secretAccessKey =
      this.configService.get<string>('AWS_SECRET_KEY');
    this.awsConfig.region = this.configService.get<string>('AWS_REGION');
    this.awsConfig.bucket = this.configService.get<string>('AWS_BUCKET_NAME');

    this.s3Client = null;
  }

  private getS3Client() {
    if (this.s3Client) return this.s3Client;

    // JS SDK v3 does not support global configuration.
    // Codemod has attempted to pass values to each service client in this file.
    // You may need to update clients outside of this file, if they use global config.
    // AWS.config.update({ region: 'ap-northeast-2' });
    const s3Client = new S3Client({
      credentials: {
        accessKeyId: this.awsConfig.accessKeyId,
        secretAccessKey: this.awsConfig.secretAccessKey,
      },
      // credentials: fromEnv(),
      region: this.awsConfig.region,
    });

    this.s3Client = s3Client;

    return s3Client;
  }

  private verifyBucket(bucket: string) {
    if (!bucket) {
      if (!this.awsConfig.bucket) {
        const errMsg = 'AWS S3 bucket name not found';
        this.logger.error(errMsg);
        throw new Error(errMsg);
      }
      bucket = this.awsConfig.bucket;
    }
    return bucket;
  }

  close() {
    if (this.s3Client) {
      this.s3Client.destroy();
      this.s3Client = null;
    }
  }

  async upload(
    bucket: string | null,
    keyPath: string,
    fileData: Buffer | string,
  ): Promise<string | null> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const service = this;

    let bucketName = bucket;

    if (!bucketName) {
      bucketName = this.awsConfig.bucket;
    }
    bucketName = this.verifyBucket(bucketName);

    const command = new PutObjectCommand({
      Bucket: this.awsConfig.bucket,
      Key: keyPath,
      Body: fileData,
    });

    try {
      const client = this.getS3Client();
      const response = await client.send(command);
      this.logger.log(`File uploaded successfully. ${response}`);
      return keyPath;
    } catch (e) {
      this.logger.error(e);
    }

    return null;
  }

  async uploadBase64(
    bucket: string,
    keyPath: string,
    base64Data: string,
    contentType = 'image/jpeg', // "image/jpeg" | "image/png"
  ) {
    const buffer = Buffer.from(base64Data, 'base64');
    const fileExtention = contentType.split('/')[1];
    const fullKeyPath = keyPath + '.' + fileExtention;
    let bucketName = bucket;
    if (!bucketName) {
      bucketName = this.awsConfig.bucket;
    }
    bucketName = this.verifyBucket(bucketName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fullKeyPath,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: contentType,
    });

    try {
      const client = this.getS3Client();
      const response = await client.send(command);
      this.logger.log(`File uploaded successfully. ${response}`);
      return fullKeyPath;
    } catch (e) {
      this.logger.error(e);
    }
  }

  // promise
  uploadFile(bucket: string, keyPath: string, filename: string) {
    const fileBody = readFileSync(filename);
    if (!fileBody) throw new Error(`File not found : ${filename}`);
    return this.upload(bucket, keyPath, fileBody);
  }

  // promise
  async download(
    bucket: string,
    keyPath: string,
    downloadPath: string,
  ): Promise<boolean> {
    bucket = this.verifyBucket(bucket);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: keyPath,
    });

    const client = this.getS3Client();

    try {
      const response = await client.send(command);
      // const str = await response.Body.transformToString();
      const arr = await response.Body.transformToByteArray();

      const fileStream = createWriteStream(downloadPath);
      fileStream.write(arr);
      fileStream.close();
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async read(bucket: string, fileName: string): Promise<Buffer> {
    bucket = this.verifyBucket(bucket);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });

    const client = this.getS3Client();

    try {
      const response = await client.send(command);
      const arr = await response.Body.transformToByteArray();
      return Buffer.from(arr);
    } catch (e) {
      this.logger.error(e);
    }
    return Buffer.from([]);
  }

  // promise :
  // return false if NOT found
  //        true if found
  //
  async exists(bucket: string, keyPath: string): Promise<boolean> {
    bucket = this.verifyBucket(bucket);

    const awsS3 = this.getS3Client();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: keyPath,
    });

    try {
      const response = await awsS3.send(command);
      console.log('response = ', response);
      return true;
    } catch (e: any) {
      if (e['$metadata'] && e['$metadata']?.httpStatusCode === 404) {
        return false;
      } else {
        console.log('Storage-S3 exists error = ', e);
      }
      this.logger.error(e);
    }
    return false;
  }

  async contentLength(bucket: string, keyPath: string): Promise<number> {
    bucket = this.verifyBucket(bucket);

    const awsS3 = this.getS3Client();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: keyPath,
    });

    try {
      const response = await awsS3.send(command);
      // HeadObjectOutput
      // console.log('response = ', response);
      return response.ContentLength || 0;
    } catch (e: any) {
      if (e['$metadata'] && e['$metadata']?.httpStatusCode === 404) {
        return -1;
      } else {
        console.log('Storage-S3 exists error = ', e);
      }
      this.logger.error(e);
    }
    return -1;
  }

  // promise : delete
  async delete(bucket: string, keyPath: string): Promise<boolean> {
    bucket = this.verifyBucket(bucket);

    const client = this.getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: keyPath,
    });

    try {
      const response = await client.send(command);
      return true;
    } catch (e) {
      this.logger.error(e);
    }
    return false;
  }

  async streamParallelUpload(
    bucket: string,
    keyPath: string,
    fileName: string,
    input: Readable,
  ) {
    try {
      const fullKeyPath = keyPath + fileName;
      const client = this.getS3Client();
      let bucketName = bucket;

      if (!bucketName) {
        bucketName = this.awsConfig.bucket;
      }
      bucketName = this.verifyBucket(bucketName);

      const parallelUploads3 = new Upload({
        client: client,
        params: {
          Bucket: bucketName,
          Key: fullKeyPath,
          Body: input,
        },
        tags: [
          /*...*/
        ], // optional tags
        queueSize: 4, // optional concurrency configuration
        partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
        leavePartsOnError: false, // optional manually handle dropped parts
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        this.logger.debug(
          `Progress: ${progress.loaded} / ${progress.total} bytes`,
        );
      });

      await parallelUploads3.done();

      return fullKeyPath;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }

  getPublicUrl(keyPath: string, bucketName: string): string {
    if (!keyPath || keyPath.length === 0) {
      this.logger.error('keyPath is empty');
      return '';
    }
    if (!bucketName || bucketName.length === 0) {
      this.logger.error('bucketName is empty');
      return '';
    }
    return `https://${bucketName}.s3.amazonaws.com/${keyPath}`;
  }
}
