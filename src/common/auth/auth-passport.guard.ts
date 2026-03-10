// 1. jwt 검증
// 2. header에 jwt 토큰을 넣어서 보내면, jwt 토큰을 검증해서 payload를 반환
// 3. sig ,timestamp 검증 필요

import {
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

//
@Injectable()
export class SessionPassportGuard extends AuthGuard(['jwt', 'google']) {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    Logger.debug((request as any).user, context.getClass().name);

    Logger.log(
      'SessionPassportGuard.canActivate() + Request Header: ' +
        JSON.stringify(request.headers),
      context.getClass().name,
    );

    const activate = (await super.canActivate(context)) as boolean;
    if (!activate) {
      throw new HttpException('Unauthorized', 401);
    }

    await super.logIn(request as any);

    return activate;
  }
}

@Injectable()
export class JwtPassportGuard extends AuthGuard('jwt') {}
