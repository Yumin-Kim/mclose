import { PassportSerializer } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor() {
    super();
  }

  async serializeUser(
    user: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    Logger.debug(user, 'serializeUser'); // 테스트 시 확인
    done(null, user);
  }

  async deserializeUser(
    payload: any,
    done: (err: any, user?: any) => void,
  ): Promise<any> {
    Logger.debug(payload, 'deserializeUser'); // 테스트 시 확인
    return done(null, payload);
  }
}
