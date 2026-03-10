import { DownloadResponse, File, Storage } from '@google-cloud/storage';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse } from 'path';
import { ApiHttpException } from '../response/response-exception.filter';
import { IGoolgeStorageResponse } from './cloud.interface';

@Injectable()
export class CloudStorageService {
  private projectId: string;
  private googleIamKey: string;
  private googleIaOSientEmail: string;
  private googleStorage: Storage;
  private googleBucketName: string;

  constructor(private configService: ConfigService) {
    this.projectId = configService.get('GOOGLE_IAM_STORAGE_PROJECT_ID');
    this.googleIamKey = configService.get('GOOGLE_IAM_STORAGE_PRIVATE_KEY');
    this.googleIaOSientEmail = configService.get(
      'GOOGLE_IAM_STORAGE_CLIENT_EMAIL',
    );
    this.googleBucketName = configService.get('GOOGLE_STORAGE_BUCKET_NAME');

    this.initializeStorage();
  }

  initializeStorage() {
    this.googleStorage = new Storage({
      projectId: this.projectId,
      credentials: {
        client_email: this.googleIaOSientEmail,
        private_key: this.googleIamKey,
      },
    });
  }

  /**
   * bucket에 저장할 경로 설정
   * @param destination
   * @returns
   */
  private setDestination(destination: string): string {
    let escDestination = '';
    escDestination += destination
      .replace(/^\.+/g, '')
      .replace(/^\/+|\/+$/g, '');
    if (escDestination !== '') escDestination = escDestination + '/';
    return escDestination;
  }

  /**
   * storage에 저장할 파일 이름 설정
   * @param uploadedFile
   * @returns
   */
  private setFilename(uploadedFile: Express.Multer.File): string {
    const fileName = parse(uploadedFile.originalname);
    return `${fileName.name
      .replaceAll(' ', '_')
      .replaceAll(/[^a-zA-Z0-9]/g, '')}-${Date.now()}${fileName.ext}`
      .replace(/^\.+/g, '')
      .replace(/^\/+/g, '')
      .replace(/\r|\n/g, '_');
  }

  /**
   * google cluod storage에 파일 저장
   * Spec:(public access) https://jsikim1.tistory.com/27
   * @param uploadedFile 업로드할 파일
   * @param destination "ex) media/"
   * @returns
   */
  async saveStorage(
    uploadedFile: Express.Multer.File,
    destination: string = '',
  ): Promise<IGoolgeStorageResponse> {
    try {
      if (!this.googleStorage) {
        this.initializeStorage();
      }

      const fileName: string =
        this.setDestination(destination) + this.setFilename(uploadedFile);

      const file: File = this.googleStorage
        .bucket(this.googleBucketName)
        .file(fileName);

      // 파일 저장
      await file.save(uploadedFile.buffer, {
        contentType: uploadedFile.mimetype,
      });

      Logger.log(
        'Success save file to google cloud storage',
        'CloudStorageService.saveStorage',
      );

      return {
        ...file.metadata,
        publicUrl: `https://storage.googleapis.com/${this.googleBucketName}/${file.name}`,
      };
    } catch (error) {
      Logger.error(error, 'CloudStorageService.saveStorage');
      throw new ApiHttpException(
        error?.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async downloadFileUrl(path: string): Promise<Buffer> {
    try {
      const file: File = await this.googleStorage
        .bucket(this.googleBucketName)
        .file(path);

      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      Logger.error(error, 'CloudStorageService.downloadFileUrl');
      throw new ApiHttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * bucket에 저장된 파일 삭제
   * @param path
   * @returns
   */
  async removeFile(path: string): Promise<boolean> {
    try {
      const file: File = this.googleStorage
        .bucket(this.googleBucketName)
        .file(path);
      await file.delete();
      return true;
    } catch (error) {
      Logger.error(error, 'CloudStorageService.removeFile');
      throw new ApiHttpException(
        error?.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
