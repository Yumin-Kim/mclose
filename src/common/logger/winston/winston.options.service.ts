/**
 * @description
 * winston logger option service
 *
 * Wiston rotate file option
 * SPEC: https://github.com/winstonjs/winston-daily-rotate-file
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerOptions } from 'winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class WinstonOptionService {
  constructor(private configService: ConfigService) {}

  createLogger(): LoggerOptions {
    const appName = this.configService.get<string>('LOG_DIR_NAME');
    const writeIntoFile = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_FILE',
    );
    const writeIntoConsole = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_CONSOLE',
    );
    const maxSize = this.configService.get<string>('WINSTON_MAX_SIZE');
    const maxFiles = this.configService.get<string>('WINSTON_MAX_FILES');

    const transports = [];

    if (writeIntoFile) {
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `./logs/${appName}/error`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true, // A boolean to define whether or not to gzip archived log files.
          maxSize: maxSize, // Maximum size of the file after which it will rotate.
          maxFiles: maxFiles, // Maximum number of logs to keep.
          level: 'error',
        }),
      );
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `./logs/${appName}/default`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: maxSize,
          maxFiles: maxFiles,
          level: 'info',
        }),
      );
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `./logs/${appName}/debug`,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: maxSize,
          maxFiles: maxFiles,
          level: 'debug',
        }),
      );
    }

    if (writeIntoConsole) {
      transports.push(new winston.transports.Console());
    }

    const loggerOptions: LoggerOptions = {
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.prettyPrint(),
      ),
      transports,
    };

    return loggerOptions;
  }
}
