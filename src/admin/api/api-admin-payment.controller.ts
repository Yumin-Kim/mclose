import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SearchPaymentDto } from '../../dto/admin.dto';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { CommonService } from '../../services/common.service';
import { OUTFLOW_HISTORY_STATUS, RESPONSE_CODE } from '../../constant';
import { AdminPaymentService } from '../../services/admin/admin-payment.service';
import { AwsSesService } from '../../common/aws/ses/aws-ses.service';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AdminCommonGuard } from '../admin.auth.guard';

@Controller('/payment')
@UseGuards(AdminCommonGuard)
export class ApiAdminPaymentController {
  private readonly fromEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly adminPaymentService: AdminPaymentService,
    private readonly awsSesService: AwsSesService,
  ) {
    this.fromEmail =
      this.configService.get<string>('AWS_FROM_EMAIL') ||
      'no-reploy@example.net';
  }

  private readonly logger = new Logger(ApiAdminPaymentController.name);

  // 매출 내역 조회
  @Get('/usage/list')
  @UseGuards()
  async getUsageList(
    @Req() req: Request,
    @Query() searchPaymentDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getUsageHistoryList(
        searchPaymentDto.getOffset(),
        searchPaymentDto.getLimit(),
        searchPaymentDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/usage/summary')
  @UseGuards()
  async getUsageSummary(
    @Req() req: Request,
    @Query() searchPaymentDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getUsageHistorySummary(
        searchPaymentDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 판매 현황 관리
  @Get('/performence/list')
  @UseGuards()
  async getUsagePerformenceList(
    @Req() req: Request,
    @Query() searchPaymentDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getUsagePerformenceList(
        searchPaymentDto.getOffset(),
        searchPaymentDto.getLimit(),
        searchPaymentDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 충전 내역 조회
  @Get('/charge/list')
  @UseGuards()
  async getChargeList(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getChargeList(
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
        searchUserDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 충전 내역 요약 조회
  @Get('/charge/summary')
  @UseGuards()
  async getChargeSummary(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchPaymentDto,
  ) {
    try {
      const reuslt =
        await this.adminPaymentService.getChargeSummary(searchUserDto);
      return reuslt;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 환불 내역 조회
  @Get('/outflow/list')
  @UseGuards()
  async getOutflowList(
    @Req() @Req() req: Request,
    @Query() searhDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getOutflowList(
        searhDto.getOffset(),
        searhDto.getLimit(),
        searhDto,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 환불 내역 요약 조회
  @Get('/outflow/summary')
  @UseGuards()
  async getOutflowSummary(
    @Req() @Req() req: Request,
    @Query() searhDto: SearchPaymentDto,
  ) {
    try {
      return await this.adminPaymentService.getOutflowSummary(searhDto);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 충전 내역 요약 조회
  @Get('/outflow/summary')
  @UseGuards()
  async getOutFlowSummary(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchPaymentDto,
  ) {
    try {
      const reuslt =
        await this.adminPaymentService.getChargeSummary(searchUserDto);
      return reuslt;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 환불/정산 내역 상세 조회
  @Get('/outflow/detail/:id')
  @UseGuards()
  async getOutflowDetail(@Req() req: Request, @Param('id') id: number) {
    try {
      return await this.adminPaymentService.getOutFlowDetail(id);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 환불/정산 내역 상세 조회 - 상태 변경
  @Post('/outflow/update/:id')
  @UseGuards()
  async updateOutflowStatus(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('status') status: string,
  ) {
    try {
      const { isSuccessful, isSendEmail } =
        await this.adminPaymentService.updateOutFlowStatus(id, status);

      if (
        isSendEmail &&
        isSuccessful &&
        status == OUTFLOW_HISTORY_STATUS.CONFIRMED
      ) {
        const outflow = await this.adminPaymentService.getOutFlowDetail(id);
        const isSendEmail = await this.sendEmail(
          outflow.user.email,
          outflow.user.realName,
          String(outflow.createdAt),
          outflow.originAmount,
          outflow.expectedAmount,
          outflow.regBankName,
          outflow.regBankAccountNumber,
          String(outflow.processAt),
          outflow.currency,
        );

        if (isSendEmail) {
          return true;
        } else {
          return false;
        }
      }

      return isSuccessful;
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async sendEmail(
    email: string,
    realName: string,
    createdAt: string,
    originAmount: number,
    expectedAmount: number,
    regBankName: string,
    regBankAccountNumber: string,
    processAt: string,
    currency: string,
  ) {
    let emailHTMLTemplate = await readFile(
      join(__dirname, '../templates/outflow_mail_confirm_settlement.html'),
      'utf8',
    );
    // html ${} 값 변경 = 고객 이름
    emailHTMLTemplate = emailHTMLTemplate.replace('[$_USERNAME_$]', realName);
    // html ${} 값 변경 = 생성 일자
    emailHTMLTemplate = emailHTMLTemplate.replace(
      '[$_DATE_$]',
      `${this.commonService.toDateFormat(createdAt)}`,
    );
    // html ${} 값 변경 = 정산 신청 재화
    emailHTMLTemplate = emailHTMLTemplate.replace(
      '[$_ORIGIN_AMOUNT_$]',
      `${this.commonService.toNumber(originAmount)} ${currency}`,
    );
    // html ${} 값 변경 = 정산 금액
    emailHTMLTemplate = emailHTMLTemplate.replace(
      '[$_EXPECTED_AMOUNT_$]',
      `${this.commonService.toNumber(expectedAmount)} 원`,
    );
    // html ${} 값 변경 = 입금 계좌
    emailHTMLTemplate = emailHTMLTemplate.replace(
      '[$_ACCOUNT_$]',
      `${regBankName} ${regBankAccountNumber}`,
    );
    // html ${} 값 변경 =
    emailHTMLTemplate = emailHTMLTemplate.replace(
      '[$_COMPLETEDATE_$]',
      this.commonService.toDateFormat(processAt),
    );

    const isSuccessful = await this.awsSesService.sendEmail(
      this.fromEmail,
      email,
      'MCLOOSE 정산 완료 이메일 입니다.',
      emailHTMLTemplate,
    );

    return isSuccessful;
  }
}
