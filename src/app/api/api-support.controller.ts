import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { RESPONSE_CODE } from '../../constant';
import { AppVerifyAuthPassGuard } from '../app.auth.guard';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import { SupportBussinessDto, SupportCustomerDto } from '../../dto/support.dto';
import { SupportActionService } from '../../services/support-action.service';
import { PageRequest } from '../../common/response/response-page';
import { AwsSesService } from '../../common/aws/ses/aws-ses.service';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { readFile } from 'fs/promises';

@Controller('/api/v1/support')
export class ApiSupportController {
  private readonly fromEmail: string;

  constructor(
    private readonly supportActionService: SupportActionService,
    private readonly awsSesService: AwsSesService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail =
      this.configService.get<string>('AWS_FROM_EMAIL') ||
      'no-reploy@example.net';
  }

  @Get('/faq/list')
  async list(@Req() req: Request, @Query() pageRequest: PageRequest) {
    try {
      return await this.supportActionService.getFapList(
        pageRequest.getOffset(),
        pageRequest.getLimit(),
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // K_TODO : 24.11.16 - 고객 문의하기
  // 이메일 수신자 수정 필요 (관리자 프로세스 정의후 수정)
  @Post('/customer')
  @UseGuards(AppVerifyAuthPassGuard)
  async createCustomerSupport(
    @Req() req: Request,
    @Body() data: SupportCustomerDto,
  ) {
    try {
      const user = req.user ? (req.user as UserEntity) : null;

      const isExist = await this.supportActionService.createCustomerSupport(
        data,
        user,
      );
      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_SUPPORT_CUSTOMER_NOT_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      let customerEmailHTML = await readFile(
        join(__dirname, '../templates/contact_mail_customer.html'),
        'utf8',
      );

      // html ${} 값 변경 = 고객 이름
      customerEmailHTML = customerEmailHTML.replace(
        '[$_USERNAME_$]',
        data.realName,
      );

      // html ${} 값 변경 = email
      customerEmailHTML = customerEmailHTML.replace(
        '[$_USEREMAIL_$]',
        data.email,
      );

      // html ${} 값 변경 = 전화번호
      customerEmailHTML = customerEmailHTML.replace(
        '[$_USERPHONE_$]',
        data.phoneNo,
      );

      // html ${} 값 변경 = 문의 내용
      customerEmailHTML = customerEmailHTML.replace(
        '[$_REQUEST_$]',
        data.content.replace(/\n/g, '<br>'),
      );

      // html ${} 값 변경 = 문의 내용
      customerEmailHTML = customerEmailHTML.replace(
        '[$_RQTYPE_$]',
        data.typeText,
      );

      // 어드민 이메일 수신자 조회
      const receivedAdminList =
        await this.supportActionService.getReceivedEmailList();

      if (!receivedAdminList || receivedAdminList.length === 0) {
        await this.awsSesService.sendEmail(
          this.fromEmail,
          'example@example.net',
          'MCLOOSE 일반 문의 메일 입니다.',
          customerEmailHTML,
        );
      } else {
        for (const admin of receivedAdminList) {
          await this.awsSesService.sendEmail(
            this.fromEmail,
            admin.email,
            'MCLOOSE 일반 문의 메일 입니다.',
            customerEmailHTML,
          );
        }
      }

      return isExist;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // K_TODO : 24.11.16 - 고객 문의하기
  // 이메일 수신자 수정 필요 (관리자 프로세스 정의후 수정)
  @Post('/business')
  @UseGuards(AppVerifyAuthPassGuard)
  async createBussinessSupport(
    @Req() req: Request,
    @Body() data: SupportBussinessDto,
  ) {
    try {
      const user = req.user ? (req.user as UserEntity) : null;

      const isExist = await this.supportActionService.createBussinessSupport(
        data,
        user,
      );

      if (!isExist) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_SUPPORT_BUSINESS_NOT_EXIST,
          HttpStatus.BAD_REQUEST,
        );
      }

      let businessEmailHTML = await readFile(
        join(__dirname, '../templates/contact_mail_business.html'),
        'utf8',
      );

      // html ${} 값 변경 = 고객 이름
      businessEmailHTML = businessEmailHTML.replace(
        '[$_USERNAME_$]',
        data.realName,
      );

      businessEmailHTML = businessEmailHTML.replace(
        '[$_USERPHONE_$]',
        data.phoneNo,
      );

      // html ${} 값 변경 = 회사 전화 번호
      if (data.companyNo) {
        businessEmailHTML = businessEmailHTML.replace(
          '[$_COPHONE_$]',
          data.companyNo,
        );
      } else {
        businessEmailHTML = businessEmailHTML.replace('[$_COPHONE_$]', '없음');
      }

      // html ${} 값 변경 = email
      businessEmailHTML = businessEmailHTML.replace(
        '[$_USEREMAIL_$]',
        data.email,
      );

      // html ${} 값 변경 = 회사명
      businessEmailHTML = businessEmailHTML.replace(
        '[$_CONAME_$]',
        data.companyName,
      );

      // html ${} 값 변경 = 부서명
      if (data.companyPartName) {
        businessEmailHTML = businessEmailHTML.replace(
          '[$_DIVISIONNAME_$]',
          data.companyPartName,
        );
      } else {
        businessEmailHTML = businessEmailHTML.replace(
          '[$_DIVISIONNAME_$]',
          '없음',
        );
      }
      businessEmailHTML = businessEmailHTML.replace(
        '[$_REQUEST_$]',
        data.content.replace(/\n/g, '<br>'),
      );

      const receivedAdminList =
        await this.supportActionService.getReceivedEmailList();
      if (!receivedAdminList || receivedAdminList.length === 0) {
        await this.awsSesService.sendEmail(
          this.fromEmail,
          'example@example.net',
          'MCLOOSE 기업 문의 메일 입니다.',
          businessEmailHTML,
        );
      } else {
        for (const admin of receivedAdminList) {
          await this.awsSesService.sendEmail(
            this.fromEmail,
            admin.email,
            'MCLOOSE 기업 문의 메일 입니다.',
            businessEmailHTML,
          );
        }
      }

      return isExist;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
