import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE } from '../../constant';
import { FaqDto, SearchSupportDto } from '../../dto/admin.dto';
import { PageRequest } from '../../common/response/response-page';
import { AdminSupportService } from '../../services/admin/admin-support.service';
import { AdminAllAuthGuard } from '../admin.auth.guard';
import { AdminEntity } from '../../entities/admin.entity';
import { AwsSesService } from '../../common/aws/ses/aws-ses.service';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Controller('/support')
export class ApiAdminSupportController {
  private readonly fromEmail: string;

  constructor(
    private readonly commonService: CommonService,
    private readonly adminSupportService: AdminSupportService,
    private readonly awsSesService: AwsSesService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail =
      this.configService.get<string>('AWS_FROM_EMAIL') ||
      'no-reploy@example.net';
  }

  private readonly logger = new Logger(ApiAdminSupportController.name);

  // 고객 문의 리스트 조회
  @Get('/customer/list')
  async getCustomerList(@Query() searchSupportDto: SearchSupportDto) {
    try {
      return await this.adminSupportService.getSupportCustomerList(
        searchSupportDto.getOffset(),
        searchSupportDto.getLimit(),
        searchSupportDto,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 기업 문의 리스트 조회
  @Get('/business/list')
  async getBusinessList(@Query() searchSupportDto: SearchSupportDto) {
    try {
      return await this.adminSupportService.getSupportBusinessList(
        searchSupportDto.getOffset(),
        searchSupportDto.getLimit(),
        searchSupportDto,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // faq 리스트 조회
  @Get('/faq/list')
  async getFaqList(@Query() searchSupportDto: SearchSupportDto) {
    try {
      return await this.adminSupportService.getFaqList(
        searchSupportDto.getOffset(),
        searchSupportDto.getLimit(),
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 문의 리스트 조회
  @Get('/customer/detail/:id')
  async getCustomerDetail(@Param('id') id: number) {
    try {
      return await this.adminSupportService.getSupportCustomerDetail(id);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 기업 문의 리스트 조회
  @Get('/business/detail/:id')
  async getBusinessDetail(@Param('id') id: number) {
    try {
      return await this.adminSupportService.getSupportBusinessDetail(id);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // faq 상세 조회
  @Get('/faq/detail/:id')
  async getFaqDetail(@Param('id') id: number) {
    try {
      return await this.adminSupportService.getFaqDetail(id);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // FAQ 생성
  @Post('/faq/create')
  @UseGuards(AdminAllAuthGuard)
  async createFaq(@Req() req: Request, @Body() faqDto: FaqDto) {
    try {
      const admin = req.user as AdminEntity;

      return await this.adminSupportService.createFaq(faqDto, admin);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/faq/delete')
  @UseGuards(AdminAllAuthGuard)
  async deleteFaq(@Req() req: Request, @Body() faqDto: FaqDto) {
    try {
      const admin = req.user as AdminEntity;

      return await this.adminSupportService.deleteFaq(faqDto);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 문의 답변글 생성 및 이메일 전송
  @Post('/customer/response/:id')
  async createCustomerSupport(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('response') response: string,
  ) {
    try {
      const customerSupport =
        await this.adminSupportService.getSupportCustomerDetail(id);
      if (!customerSupport) {
        return false;
      }

      const isSuccessDbOperation =
        await this.adminSupportService.createResponseCustomerSupport(
          id,
          response,
        );
      if (!isSuccessDbOperation) {
        return false;
      }

      // 이메일 전송
      const isSuccessful = await this.sendEmail(
        customerSupport.email,
        customerSupport.realName,
        customerSupport.content,
        response,
      );
      if (!isSuccessful) {
        return false;
      }
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 문의 상태 변경
  @Post('/customer/status/:id')
  async updateCustomerSupportStatus(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('status') status: string,
  ) {
    try {
      const customerSupport =
        await this.adminSupportService.getSupportCustomerDetail(id);
      if (!customerSupport) {
        return false;
      }

      const isSuccessDbOperation =
        await this.adminSupportService.updateStatusCustomerSupport(id, status);
      if (!isSuccessDbOperation) {
        return false;
      }

      return true;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // @Post('/business/response/:id')
  // async createBusinessSupport(
  //   @Req() req: Request,
  //   @Body('response') response: string
  //   @Param('id') id: number) {
  //   try {
  //     const businessSupport = await this.adminSupportService.getSupportBusinessDetail(id);
  //     if (!businessSupport) {
  //       return false;
  //     }

  //     const isSuccessDbOperation = await this.adminSupportService.createResponseBusinessSupport(id, response);
  //     if (!isSuccessDbOperation) {
  //       return false;
  //     }

  //     return true;
  //   } catch (err) {
  //     throw new ApiHttpException(
  //       err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  // 고객 문의 상태 변경
  @Post('/customer/status/:id')
  async updateBusinessSupportStatus(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('status') status: string,
  ) {
    try {
      const customerSupport =
        await this.adminSupportService.getSupportBusinessDetail(id);
      if (!customerSupport) {
        return false;
      }

      const isSuccessDbOperation =
        await this.adminSupportService.updateStatusBusinessSupport(id, status);
      if (!isSuccessDbOperation) {
        return false;
      }

      return true;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async sendEmail(
    email: string,
    realName: string,
    requestContent: string,
    responseContent: string,
  ) {
    let customerEmailHTML = await readFile(
      join(__dirname, '../templates/contact_mail_confirm.html'),
      'utf8',
    );
    // html ${} 값 변경 = 고객 이름
    customerEmailHTML = customerEmailHTML.replace('[$_USERNAME_$]', realName);
    // html ${} 값 변경 = 문의글
    customerEmailHTML = customerEmailHTML.replace(
      '[$_REQUEST_$]',
      requestContent.replace(/\n/g, '<br>'),
    );
    // html ${} 값 변경 = 답변글
    customerEmailHTML = customerEmailHTML.replace(
      '[$_RESPONSE_$]',
      responseContent.replace(/\n/g, '<br>'),
    );

    const isSuccessful = await this.awsSesService.sendEmail(
      this.fromEmail,
      email,
      'MCLOOSE 문의 답변 메일 입니다.',
      customerEmailHTML,
    );

    return isSuccessful;
  }
}
