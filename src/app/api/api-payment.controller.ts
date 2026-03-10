/**
 * prepare로 amount , payMethod를 받아서 결제 준비를 한다.
 * 단 front에서 amount 변경시 오류 발생함
 */
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserDto } from '../../dto/user.dto';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { RESPONSE_CODE } from '../../constant';
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { PortoneService } from '../../services/portone.service';
import { randomUUID } from 'crypto';
import { PaymentDto } from '../../dto/payment.dto';
import { PaymentService } from '../../services/payment.service';
import { UserEntity } from '../../entities/user.entity';

@Controller('/api/v1/payment')
export class ApiPaymentController {
  constructor(
    private readonly portoneService: PortoneService,
    private readonly paymentService: PaymentService,
  ) { }

  @Post('/prepare')
  @UseGuards(AppApiAuthGuard)
  async prepare(@Req() @Req() req: Request, @Body() body: PaymentDto) {
    try {
      const { amount, chargeAmount } = body;

      // 사용자 정보 확인
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 결제 요청전 준비
      const uuid = randomUUID();
      const isPaymentReady = await this.portoneService.prepare(uuid, amount);
      if (!isPaymentReady) {
        throw new ApiHttpException(
          RESPONSE_CODE.PAYMENT_PREPARE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      body.merchantUid = uuid;

      // 결제 요청전 준비
      const paymentHistoy = await this.paymentService.create(body, user);
      if (!paymentHistoy) {
        throw new ApiHttpException(
          RESPONSE_CODE.PAYMENT_ERROR_CREATE,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        amount,
        merchantUid: uuid,
      };
    } catch (e) {
      console.log(e);

      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/complete')
  @UseGuards(AppApiAuthGuard)
  async complete(@Req() req: Request, @Body() body: PaymentDto) {
    try {
      const { merchantUid, impUid } = body;

      // 사용자 정보 확인
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 결제 완료 처리
      const isPaymentComplete = await this.paymentService.complete(
        impUid,
        merchantUid,
        user,
      );
      if (!isPaymentComplete) {
        throw new ApiHttpException(
          RESPONSE_CODE.PAYMENT_COMPLETE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      // TODO: 결제 완료 후 처리
      return {
        merchantUid,
        impUid,
      };
    } catch (e) {
      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/cancel')
  @UseGuards(AppApiAuthGuard)
  async cancel(@Req() req: Request, @Body() body: PaymentDto) {
    try {
      const { merchantUid, errorMsg, errorCode } = body;

      // 사용자 정보 확인
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 결제 취소 처리
      const isPaymentCancel = await this.paymentService.cancel(
        merchantUid,
        errorCode,
        errorMsg,
      );
      if (!isPaymentCancel) {
        throw new ApiHttpException(
          RESPONSE_CODE.PAYMENT_REFUND_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (e) {
      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/verify-account')
  async verifyAccount(@Req() req: Request, @Body() body: UserDto) {
    try {
      const { bankAccountNumber, bankCode, realName } = body;

      // 결제 계좌 확인
      const isVerifyAccount = await this.portoneService.getBankHolder(
        bankCode,
        bankAccountNumber,
      );
      if (!isVerifyAccount || isVerifyAccount !== realName) {
        throw new ApiHttpException(
          RESPONSE_CODE.PAYMENT_INVALID_BANK_ACCOUNT,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (e) {
      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // @desc https://developers.portone.io/opi/ko/support/code-info/pg-1?v=v1
  // 토스페이먼츠 , 나이스페이먼츠 , kicc 한정 사용 가능
  @Get('/bank-list')
  async bankList() {
    try {
      return [
        {
          name: 'KB국민은행',
          code: '004',
        },
        {
          name: 'SC제일은행',
          code: '023',
        },
        {
          name: '경남은행',
          code: '039',
        },
        {
          name: '광주은행',
          code: '034',
        },
        {
          name: '기업은행',
          code: '003',
        },
        {
          name: '농협',
          code: '011',
        },
        {
          name: '대구은행',
          code: '031',
        },
        {
          name: '부산은행',
          code: '032',
        },
        {
          name: '산업은행',
          code: '002',
        },
        {
          name: '새마을금고',
          code: '045',
        },
        {
          name: '수협',
          code: '007',
        },
        {
          name: '신한은행',
          code: '088',
        },
        {
          name: '신협',
          code: '048',
        },
        {
          name: '하나',
          code: '환)은행: 081',
        },
        {
          name: '우리은행',
          code: '020',
        },
        {
          name: '우체국',
          code: '071',
        },
        {
          name: '전북은행',
          code: '037',
        },
        {
          name: '축협',
          code: '012',
        },
        {
          name: '카카오뱅크',
          code: '090',
        },
        {
          name: '케이뱅크',
          code: '089',
        },
        {
          name: '한국씨티은행',
          code: '027',
        },
        {
          name: '토스뱅크',
          code: '092',
        },
      ];
    } catch (e) {
      throw new ApiHttpException(
        e.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
