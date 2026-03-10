import { Injectable, NestMiddleware } from '@nestjs/common';
import * as morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { createStream } from 'rotating-file-stream';
import { ConfigService } from '@nestjs/config';
import {
  IWInstonHttpConfig,
  IWInstonHttpConfigOptions,
  IWinstonHttpMiddleware,
} from './winston.interface';
import { WinstonHelperDateService } from './winston-helper.service';

export const DEBUGGER_HTTP_NAME = 'http';
// export const DEBUGGER_HTTP_FORMAT =
//   "':remote-addr' - ':remote-user' - '[:date[iso]]' - 'HTTP/:http-version' - '[:status]' - ':method' - ':url' - 'Request Header :: :req-headers' - 'Request Params :: :req-params' - 'Request Body :: :req-body' - 'Response Header :: :res[header]' - 'Response Body :: :res-body' - ':response-time ms' - ':referrer' - ':user-agent'";
export const DEBUGGER_HTTP_FORMAT =
  "'[:date[iso]]' - ':remote-addr' - ':remote-user' - 'HTTP/:http-version' - '[:status]' - ':method' - ':url' - 'Request Header :: :req-headers' - ':response-time ms' - ':referrer' - ':user-agent'";

@Injectable()
export class WinstonHttpMiddleware implements NestMiddleware {
  private readonly writeIntoFile: boolean;
  private readonly writeIntoConsole: boolean;

  constructor(private readonly configService: ConfigService) {
    this.writeIntoFile = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_FILE',
    );
    this.writeIntoConsole = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_CONSOLE',
    );
  }

  private customToken(): void {
    morgan.token('req-params', (req: Request) => JSON.stringify(req.params));

    morgan.token('req-body', (req: Request) => JSON.stringify(req.body));

    morgan.token(
      'res-body',
      (req: Request, res: IWinstonHttpMiddleware) => res.body,
    );

    morgan.token('req-headers', (req: Request) => JSON.stringify(req.headers));
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.writeIntoConsole || this.writeIntoFile) {
      this.customToken();
    }

    next();
  }
}

@Injectable()
export class WinstonHttpWriteIntoFileMiddleware implements NestMiddleware {
  private readonly writeIntoFile: boolean;
  private readonly maxSize: string;
  private readonly maxFiles: number;
  private readonly appName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly WinstonHelperDateService: WinstonHelperDateService,
  ) {
    this.writeIntoFile = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_FILE',
    );
    this.maxSize = this.configService.get<string>('WINSTON_MAX_SIZE');
    this.maxFiles = this.configService.get<number>('WINSTON_MAX_FILES');
    this.appName = this.configService.get<string>('LOG_DIR_NAME') ?? 'DEFAULT';
  }

  private async httpLogger(): Promise<IWInstonHttpConfig> {
    const date: string = this.WinstonHelperDateService.format(
      this.WinstonHelperDateService.create(),
    );

    const debuggerHttpOptions: IWInstonHttpConfigOptions = {
      stream: createStream(`${date}.log`, {
        path: `./logs/${this.appName}/http`,
        maxFiles: Number(this.maxFiles),
        compress: true,
        interval: '1d',
        size: this.maxSize,
      }),
    };

    return {
      debuggerHttpFormat: DEBUGGER_HTTP_FORMAT,
      debuggerHttpOptions,
    };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.writeIntoFile) {
      const config: IWInstonHttpConfig = await this.httpLogger();

      morgan(config.debuggerHttpFormat, config.debuggerHttpOptions)(
        req,
        res,
        next,
      );
    } else {
      next();
    }
  }
}

@Injectable()
export class WinstonHttpWriteIntoConsoleMiddleware implements NestMiddleware {
  private readonly writeIntoConsole: boolean;

  constructor(private readonly configService: ConfigService) {
    this.writeIntoConsole = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_CONSOLE',
    );
  }

  private async httpLogger(): Promise<IWInstonHttpConfig> {
    return {
      debuggerHttpFormat: DEBUGGER_HTTP_FORMAT,
    };
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.writeIntoConsole) {
      const config: IWInstonHttpConfig = await this.httpLogger();

      morgan(config.debuggerHttpFormat)(req, res, next);
    } else {
      next();
    }
  }
}

@Injectable()
export class WinstonHttpResponseMiddleware implements NestMiddleware {
  private readonly writeIntoFile: boolean;
  private readonly writeIntoConsole: boolean;

  constructor(private readonly configService: ConfigService) {
    this.writeIntoConsole = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_CONSOLE',
    );
    this.writeIntoFile = this.configService.get<boolean>(
      'WINSTON_WRITE_INTO_FILE',
    );
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (this.writeIntoConsole || this.writeIntoFile) {
      const send: any = res.send;
      const resOld: any = res;

      // Add response data to request
      // this is for morgan
      resOld.send = (body: any) => {
        resOld.body = body;
        resOld.send = send;
        resOld.send(body);

        res = resOld as Response;
      };
    }

    next();
  }
}
