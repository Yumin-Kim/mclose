import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private PASSWORD_SAULT: string;
  private JWT_SECRET_KEY: string;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.PASSWORD_SAULT = this.configService.get('PASSWORD_SAULT') as string;
    this.JWT_SECRET_KEY = this.configService.get('JWT_SECRET_KEY') as string;
  }

  randomInt(min: number, max: number): number {
    return crypto.randomInt(min, max);
  }

  hashFunc(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  roundPassword(hashedPassword: string, round: number): string {
    const basePassword = this.hashFunc(this.PASSWORD_SAULT + hashedPassword);

    let result = basePassword;

    for (let i = 0; i < round; i++) {
      result = this.hashFunc(result);
    }

    return result;
  }

  makeSafePassword(plain: string, round: number): string {
    const hashedPassword = this.hashFunc(plain);
    return this.roundPassword(hashedPassword, round);
  }

  verifySecurePassword(
    securePassword: string,
    secureRound: number,
    loginPw: string,
    passRound: number,
  ): boolean {
    if (secureRound > passRound) {
      for (let i = passRound; i < secureRound; i++) {
        loginPw = this.hashFunc(loginPw);
      }
    } else if (secureRound < passRound) {
      for (let i = secureRound; i < passRound; i++) {
        securePassword = this.hashFunc(securePassword);
      }
    }

    let verified = false;
    if (securePassword === loginPw) {
      verified = true;
    }
    return verified;
  }

  // =============== jwt ===============

  generateJWTToken(payload: any, expiresIn: string): string {
    return this.jwtService.sign(payload, {
      secret: this.JWT_SECRET_KEY,
      expiresIn: expiresIn,
    });
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.JWT_SECRET_KEY,
      });
    } catch (e) {
      return null;
    }
  }

  generateSig(encodingData: string) {
    return crypto
      .createHmac('sha256', this.configService.get('API_SECRET_KEY') as string)
      .update(encodingData)
      .digest('base64');
  }

  // =============== user ===============
}
