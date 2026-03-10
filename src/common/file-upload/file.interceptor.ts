import { HttpStatus, Injectable } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiHttpException } from '../response/response-exception.filter';

@Injectable()
export class CommonFileInterceptor extends FileInterceptor('file') {
  constructor() {
    super({
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 * 100 * 100 }, // 100MB --- 100*2^20
      fileFilter: (req, file, callback) => {
        switch (file.mimetype) {
          case 'image/jpg':
          case 'image/jpeg':
          case 'image/png':
          case 'image/gif':
            return callback(null, true);
          case 'video/mp4':
          case 'video/mpeg':
          case 'video/webm':
          case 'video/quicktime':
            return callback(null, true);
          default:
            return callback(
              new ApiHttpException(
                'Only image files are allowed',
                HttpStatus.BAD_REQUEST,
              ),
              false,
            );
        }
      },
    });
  }
}

@Injectable()
export class CommonExcelFileInterceptor extends FileInterceptor('file') {
  constructor() {
    super({
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 * 20 }, // 2MB --- 2*2^20
      fileFilter: (req, file, callback) => {
        return file.mimetype.match(
          /application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/,
        )
          ? callback(null, true)
          : callback(
              new ApiHttpException(
                'Only excel files are allowed',
                HttpStatus.BAD_REQUEST,
              ),
              false,
            );
      },
    });
  }
}

@Injectable()
export class CommonFileListInterceptor extends FilesInterceptor('files') {
  constructor() {
    const allowedMimeTypes = [
      'image/jpg',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    super({
      storage: memoryStorage(),
      limits: { fileSize: 1024 * 1024 * 20 }, // 2MB --- 2*2^20
      fileFilter: (req, file, callback) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new ApiHttpException(
              'Only image/pdf files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    });
  }
}
