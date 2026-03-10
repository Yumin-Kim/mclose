import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { UserDto } from '../../dto/user.dto';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { RESPONSE_CODE } from '../../constant';
import { AuthService } from '../../common/auth/auth.service';
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { PortoneService } from '../../services/portone.service';
import { UserEntity } from '../../entities/user.entity';
import { AccountService } from '../../services/account.service';

@Controller('/api/v1/user')
export class ApiUserController {
  private readonly logger = new Logger(ApiUserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly portoneService: PortoneService,
    private readonly accountService: AccountService,
  ) { }

  @Get('/verify-token')
  async verifyToken(@Req() req: Request) {
    try {
      const jwt = req.headers['authorization'] || null;

      if (!jwt) {
        throw new ApiHttpException(
          RESPONSE_CODE.AUTH_INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const payload = this.authService.verifyToken(jwt);

      if (!payload || payload.exp < Date.now() / 1000) {
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
          RESPONSE_CODE.AUTH_INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (userResult.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_IS_DELETED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/verify-email')
  async verifyEmail(@Query('email') email: string) {
    try {
      const isExistByEmail = await this.userService.getEntityByEmail(email);
      if (isExistByEmail) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_ALREADY_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/verify-phone')
  async verifyPhoneNo(@Query('phone') phoneNo: string) {
    try {
      const isExistByPhoneNo =
        await this.userService.getEntityByPhoneNo(phoneNo);
      if (isExistByPhoneNo) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_ALREADY_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/verify-password')
  @UseGuards(AppApiAuthGuard)
  async verifyPassword(@Req() req: Request, @Body() body: UserDto) {
    try {
      const { id } = req.user as UserDto;
      const { nonce, hashPassword } = body;

      const isExistByPassword = await this.userService.verifyPassword(
        id,
        nonce,
        hashPassword,
      );

      if (!isExistByPassword) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_INVALID_PASSWORD,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 테스트 필요
  @Get('/is-insufficient')
  @UseGuards(AppApiAuthGuard)
  async isSufficient(
    @Req() req: Request,
    @Query('currency') currency: string,
    @Query('amount') amount: number,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const isSufficient = await this.accountService.isInSufficientBalance(
        amount,
        currency,
        user.id,
        null,
      );
      return {
        isSufficient,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/update-token')
  @UseGuards(AppApiAuthGuard)
  async updateToken(@Req() req: Request) {
    try {
      const user = req.user as UserDto;
      const jwt = req.headers['authorization'] || null;

      if (!jwt) {
        throw new ApiHttpException(
          RESPONSE_CODE.AUTH_INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }

      const payload = this.authService.verifyToken(jwt);

      if (!payload || payload.exp < Date.now() / 1000) {
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
          RESPONSE_CODE.AUTH_INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (userResult.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_IS_DELETED,
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokenInfo = await this.userService.updateToken(user.id);
      return {
        jwt: tokenInfo.jwt,
        id: user.id,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 본인 인증한 이후 API 요청 보냄
  @Post('/update-password/prepare')
  async updatePasswordPrepare(@Body() body: UserDto) {
    try {
      const { email, realName, phoneNo } = body;

      const user = await this.userService.getEntityByEmail(email);

      if (!user || user.realName !== realName || user.phoneNo !== phoneNo) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/update-password/execute')
  async updatePasswordExcute(@Req() req: Request, @Body() body: UserDto) {
    try {
      const { hashPassword, nonce, newHashPassword, email, realName, phoneNo } =
        body;

      const user = await this.userService.getEntityByEmail(email);

      if (!user || user.realName !== realName || user.phoneNo !== phoneNo) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 비밀번호가 같은지 확인
      const isSamePw = await this.userService.verifyPassword(
        user.id,
        nonce,
        hashPassword,
      );
      if (isSamePw) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_CURRENT_PASSOWRD_NEW_PASSWORD_SAME,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 비밀번호 업데이트
      const isUpdatePw = await this.userService.updatePassword(
        user.id,
        newHashPassword,
      );

      if (!isUpdatePw) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_INVALID_PASSWORD,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 본인 인증한 이후 API 요청 보냄(uuid가 필요 할 수 도)
  @Post('/find-login-id')
  async findLoginId(@Body() body: UserDto) {
    try {
      const { realName, phoneNo } = body;

      const user = await this.userService.getEntityByRealNameAndPhoneNo(
        realName,
        phoneNo,
      );

      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        email: user.loginId,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/update-profile')
  @UseGuards(AppApiAuthGuard)
  async updateProfile(@Req() req: Request, @Body() body: UserDto) {
    try {
      const user = req.user as UserDto;
      const { bankCode, bankAccountNumber, bankName, hashPassword, nonce, newHashPassword } =
        body;

      // 비밀 번호 변경 요청시
      if (hashPassword && nonce) {
        // 비밀번호 확인
        const isSamePw = await this.userService.verifyPassword(
          user.id,
          nonce,
          hashPassword,
        );
        if (isSamePw) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_CURRENT_PASSOWRD_NEW_PASSWORD_SAME,
            HttpStatus.BAD_REQUEST,
          );
        }

        // 비밀번호 업데이트
        const isUpdatePw = await this.userService.updatePassword(
          user.id,
          newHashPassword,
        );
        if (!isUpdatePw) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_INVALID_PASSWORD,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 은행 계좌 확인
      if (bankCode && bankAccountNumber && bankName) {
        const banckHolder = await this.portoneService.getBankHolder(
          bankCode,
          bankAccountNumber,
        );
        if (!banckHolder) {
          throw new ApiHttpException(
            RESPONSE_CODE.PAYMENT_INVALID_BANK_ACCOUNT,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (banckHolder != user.realName) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_BANK_ACCOUNT_NOT_MATCH,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      await this.userService.update(user.id, body);
      return true;
    } catch (e) {
      this.logger.error(e);
      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/get-profile')
  @UseGuards(AppApiAuthGuard)
  async getProfile(@Req() req: Request) {
    try {
      const user = req.user as UserDto;

      const entity = await this.userService.getEntityById(user.id);
      if (!entity) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        id: entity.id,
        realName: entity.realName,
        email: entity.email,
        phoneNo: entity.phoneNo,
        bankCode: entity.bankCode,
        bankAccountNumber: entity.bankAccountNumber,
        bankName: entity.bankName,
      };
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/signup')
  async signup(@Body() body: UserDto) {
    try {
      const { email, realName, bankCode, bankAccountNumber } = body;

      // 이메일 중복 검증
      const isExistByEmail = await this.userService.getEntityByEmail(email);
      if (isExistByEmail) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_ALREADY_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 전화 번호 중복 검증??
      // TODO: 본인 인증 하면서 검증 가능할 것 같음

      // 예금주명 검증
      // TODO: bankCode는 프론트에서 검증할지 아니면 서버 Object로 관리할지 미정
      // const banckHolder = await this.portoneService.getBankHolder(
      //   bankCode,
      //   bankAccountNumber,
      // );
      // if (!banckHolder) {
      //   throw new ApiHttpException(
      //     RESPONSE_CODE.PAYMENT_INVALID_BANK_ACCOUNT,
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }
      // if (banckHolder != realName) {
      //   throw new ApiHttpException(
      //     RESPONSE_CODE.USER_BANK_ACCOUNT_NOT_MATCH,
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      const newEntity = await this.userService.signup(body);

      return newEntity;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/signin')
  async signin(@Body() userDto: UserDto) {
    try {
      const user = await this.userService.getEntityByEmail(userDto.email);
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (user.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_IS_DELETED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 5회 이상 로그인 실패시 계정 잠금
      if (user.signInRetrialCount >= 5) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_SIGNIN_RETRIAL_COUNT_EXCEEDED,
          HttpStatus.BAD_REQUEST,
        );
      }

      const userInfo = this.userService.signin(user, userDto);
      return userInfo;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/signout')
  @UseGuards(AppApiAuthGuard)
  async signout() {
    try {
      // TBD: 로그아웃 처리
      return true;
    } catch (error) {
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/delete')
  @UseGuards(AppApiAuthGuard)
  async delete(@Req() req: Request) {
    try {
      const user = req.user as UserDto;
      await this.userService.delete(user.id);

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/logout')
  @UseGuards(AppApiAuthGuard)
  async logout(@Req() req: Request) {
    try {
      const user = req.user as UserDto;
      await this.userService.logout(user.id);

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 본인 인증 요청 API 작성
}
