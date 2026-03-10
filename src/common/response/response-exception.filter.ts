import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RESPONSE_CODE } from '../../constant';

export class GuardUnauthorizedException extends HttpException {
  constructor(msg: string) {
    super(msg, HttpStatus.UNAUTHORIZED);
  }
}

// API에서 사용하는 Exception(RenderHttpException)
export class ApiHttpException extends HttpException {
  constructor(data: any, status: HttpStatus) {
    super(data, status);
  }
}

// SSR에서 사용하는 Exception(RenderHttpException)
export class RenderHttpException extends HttpException {
  private renderPageName: string;
  private mappingData: string;

  /**
   * @param renderPage // render page name
   * @param data // render page data
   * @param msg // error message
   * @param status // http status
   */
  constructor(renderPage: string, data: any, msg: string, status: HttpStatus) {
    super(msg, status);
    this.renderPageName = renderPage;
    this.mappingData = data;
  }

  getRenderPageName(): string {
    return this.renderPageName;
  }

  getMappingData(): any {
    return this.mappingData;
  }
}

// API에서 사용하는 ExceptionFilter(ApiHttpException)
// Pipe에서 발생한 Exception을 처리하기 위해 HTTPException
@Catch(ApiHttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let responseExceptionMessage: any;
    if (Array.isArray(exception.getResponse()['message'])) {
      responseExceptionMessage = exception.getResponse()['message'].join();
    } else {
      responseExceptionMessage = exception.message;
    }

    response.status(status).json({
      retCode: status,
      msg: responseExceptionMessage,
      command: request.url.replaceAll('/', '_').slice(1),
    });
  }
}

// SSR에서 사용하는 ExceptionFilter(RenderHttpException)
// Pipe에서 발생한 Exception을 처리하기 위해 HTTPException
@Catch(RenderHttpException)
export class RenderExceptionFilter implements ExceptionFilter {
  catch(exception: RenderHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    response
      .status(status)
      .render(exception.getRenderPageName(), exception.getMappingData());
  }
}

// SSR에서 사용하는 ExceptionFilter(NotFoundException)
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let reponseRetCode: any;

    switch (exception.constructor) {
      case RenderHttpException:
        status = (exception as RenderHttpException).getStatus();
        response
          .status(status)
          .render(
            (exception as RenderHttpException).getRenderPageName(),
            (exception as RenderHttpException).getMappingData(),
          );
        break;
      // class-validator에서 발생하는 BadRequestException
      case ApiHttpException:
      case BadRequestException:
      case NotFoundException:
        status = (exception as HttpException).getStatus();

        reponseRetCode = (exception as HttpException).getResponse();

        response.status(status).json({
          status,
          retCode: reponseRetCode,
          command: request.url.replaceAll('/', '_').slice(1),
        });
        break;
      // case NotFoundException:
      //   status = HttpStatus.NOT_FOUND;
      //   response.status(status).render('error');
      //   break;
      default:
        Logger.error(exception);
        response.status(status).json({
          status,
          retCode: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
          command: request.url.replaceAll('/', '_').slice(1),
        });
        break;
    }
  }
}
