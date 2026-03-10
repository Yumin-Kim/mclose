import {
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../common/auth/auth.service';
import {
  ApiHttpException,
  RenderHttpException,
} from '../common/response/response-exception.filter';

import { Request } from 'express';
import { COOKIE_JWT_TOKEN, RESPONSE_CODE } from '../constant';
import { CommonService } from '../services/common.service';
import { UserService } from '../services/user.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AppApiAuthGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private commonService: CommonService,
    private userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const jwt: string = request.headers['authorization'];

    // jwt null check
    if (!jwt) {
      Logger.error('jwt is null');
      throw new ApiHttpException(
        RESPONSE_CODE.AUTH_INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException(
        RESPONSE_CODE.AUTH_INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userResult = await this.userService.verifyJWTToken(
      jwt,
      Number(payload.id),
    );

    if (!userResult) {
      throw new ApiHttpException(
        RESPONSE_CODE.USER_NOT_FOUND,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (userResult.isDeleted) {
      throw new ApiHttpException(
        RESPONSE_CODE.USER_IS_DELETED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = userResult as UserEntity;

    return true;
  }
}

/**
 * jwt 토큰 검증 및 사용자 정보를 request.user에 저장하는 AuthGuard
 * 존재하지 않는 경우 예외처리 하지않음
 */
@Injectable()
export class AppVerifyAuthPassGuard extends AuthGuard('jwt') {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    const jwt: string = request.headers['authorization'];

    if (jwt) {
      const payload = this.authService.verifyToken(jwt);
      if (payload && payload.exp > Date.now() / 1000) {
        const userResult = await this.userService.verifyJWTToken(
          jwt,
          Number(payload.id),
        );
        if (userResult) {
          request.user = userResult as UserEntity;
          return true;
        }
      }
    }

    return true;
  }
}

// TODO: Cookie 제거 및 jwt 토큰 검증 로직 추가
@Injectable()
export class AppRenderAuthGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private commonService: CommonService,
    private userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    let jwt = request.headers[COOKIE_JWT_TOKEN] as string;

    if (!jwt) {
      Logger.error('jwt is null');
      jwt = request.cookies[COOKIE_JWT_TOKEN];

      if (!jwt) {
        Logger.error('jwt is null');
        throw new ApiHttpException('jwt is null', HttpStatus.UNAUTHORIZED);
      }
    }

    // jwt verify and expired check
    const payload = this.authService.verifyToken(jwt);
    if (!payload || payload.exp < Date.now() / 1000) {
      Logger.error('jwt is expired');
      throw new ApiHttpException('jwt is expired', HttpStatus.UNAUTHORIZED);
    }
    const userInfo = await this.userService.getEntityById(payload.id);

    // ip check
    if (!userInfo) {
      throw new RenderHttpException(
        'index',
        null,
        'User not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (userInfo.isDeleted) {
      throw new RenderHttpException(
        'index',
        null,
        'User is deleted',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = userInfo as UserEntity;

    return true;
  }
}
