import { PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import { IFile } from './file.interface';
import {
  ENUM_FILE_AUDIO_MIME,
  ENUM_FILE_EXCEL_MIME,
  ENUM_FILE_IMAGE_MIME,
  ENUM_FILE_PDF_MIME,
  ENUM_FILE_VIDEO_MIME,
} from './file.constant';
import { ApiHttpException } from '../response/response-exception.filter';

@Injectable()
export class FileTypeImagePipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      for (const val of value) {
        await this.validate(val.mimetype);
      }

      return value;
    }

    const file = value as IFile;
    await this.validate(file.mimetype);

    return value;
  }

  async validate(mimetype: string): Promise<void> {
    if (
      !Object.values(ENUM_FILE_IMAGE_MIME).find(
        (val) => val === mimetype.toLowerCase(),
      )
    ) {
      throw new ApiHttpException(
        'Check File Type[image]',
        HttpStatus.BAD_REQUEST,
      );
    }

    return;
  }
}

@Injectable()
export class FileTypePdfPipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      for (const val of value) {
        await this.validate(val.mimetype);
      }

      return value;
    }

    const file = value as IFile;
    await this.validate(file.mimetype);

    return value;
  }

  async validate(mimetype: string): Promise<void> {
    if (
      !Object.values(ENUM_FILE_PDF_MIME).find(
        (val) => val === mimetype.toLowerCase(),
      )
    ) {
      throw new ApiHttpException(
        'Check File Type[Pdf]',
        HttpStatus.BAD_REQUEST,
      );
    }

    return;
  }
}

@Injectable()
export class FileTypeVideoPipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    if (Array.isArray(value)) {
      for (const val of value) {
        await this.validate(val.mimetype);
      }

      return value;
    }

    const file = value as IFile;
    await this.validate(file.mimetype);

    return value;
  }

  async validate(mimetype: string): Promise<void> {
    if (
      !Object.values(ENUM_FILE_VIDEO_MIME).find(
        (val) => val === mimetype.toLowerCase(),
      )
    ) {
      throw new ApiHttpException(
        'Check File Type[video]',
        HttpStatus.BAD_REQUEST,
      );
    }

    return;
  }
}

@Injectable()
export class FileTypeAudioPipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    if (Array.isArray(value)) {
      for (const val of value) {
        await this.validate(val.mimetype);
      }

      return value;
    }

    const file = value as IFile;
    await this.validate(file.mimetype);

    return value;
  }

  async validate(mimetype: string): Promise<void> {
    if (
      !Object.values(ENUM_FILE_AUDIO_MIME).find(
        (val) => val === mimetype.toLowerCase(),
      )
    ) {
      throw new ApiHttpException(
        'Check File Type[audio]',
        HttpStatus.BAD_REQUEST,
      );
    }

    return;
  }
}

@Injectable()
export class FileTypeExcelPipe implements PipeTransform {
  async transform(value: IFile | IFile[]): Promise<IFile | IFile[]> {
    if (Array.isArray(value)) {
      for (const val of value) {
        await this.validate(val.mimetype);
      }

      return value;
    }

    const file: IFile = value as IFile;
    await this.validate(file.mimetype);

    return value;
  }

  async validate(mimetype: string): Promise<void> {
    if (
      !Object.values(ENUM_FILE_EXCEL_MIME).find(
        (val) => val === mimetype.toLowerCase(),
      )
    ) {
      throw new ApiHttpException(
        'Check File Type[excel]',
        HttpStatus.BAD_REQUEST,
      );
    }

    return;
  }
}
