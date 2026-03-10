import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

// JwtStrategy는 PassportStrategy를 상속받아서 구현한다.
// application 구현간 별도의 guard를 구현하여 사용해야하며 현재 코드는 참고용으로만 사용한다.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('default'),
      secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any, done: VerifiedCallback): Promise<any> {
    const user = await Promise.resolve(payload);
    return done(null, user);
  }
}
