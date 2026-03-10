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
import { SearchMarketDto } from '../../dto/admin.dto';
import { Request } from 'express';
import { AdminCommonGuard, AdminSuperAuthGuard } from '../admin.auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE, STOCK_EVENT, STOCK_MESSAGE_TYPE } from '../../constant';
import { AdminMarketService } from '../../services/admin/admin-market.service';
import { AwsSesService } from '../../common/aws/ses/aws-ses.service';
import { AdminStockService } from '../../services/admin/admin-stock.service';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { AdminDaemonService } from '../../services/daemon/admin-daemon.service';
import { DaemonOrderDefaultResultDto } from '../../dto/stock.dto';

@Controller('/market')
@UseGuards(AdminCommonGuard)
export class ApiAdminMarketController {
  private readonly fromEmail: string;
  private readonly stockMatchingInQueueUrl: string;
  private readonly stockMatchingOutQueueUrl: string;
  private readonly stockGatewayQueueUrl: string;

  constructor(
    private readonly adminDaemonService: AdminDaemonService,
    private readonly commonService: CommonService,
    private readonly adminMarketService: AdminMarketService,
    private readonly adminStockService: AdminStockService,
    private readonly awsSesService: AwsSesService,
    private readonly configService: ConfigService,
  ) {
    this.fromEmail =
      this.configService.get<string>('AWS_FROM_EMAIL') ||
      'no-reploy@example.net';
    this.stockMatchingInQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_IN_FIFO_QUEUE_URL',
    );
    this.stockMatchingOutQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_MATCHING_OUT_FIFO_QUEUE_URL',
    );
    this.stockGatewayQueueUrl = this.configService.get<string>(
      'AWS_SQS_STOCK_GATEWAY_QUEUE_URL',
    );
  }

  private readonly logger = new Logger(ApiAdminMarketController.name);

  // 마켓 등록 상품 조회
  @Get('/list')
  async list(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchMarketDto,
  ) {
    try {
      return await this.adminMarketService.list(
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

  // 마켓 등록 상품 상세 조회
  @Get('/detail/:id')
  @UseGuards()
  async getDetail(@Req() @Req() req: Request, @Param('id') id: number) {
    try {
      return await this.adminMarketService.getDetail(id);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 마켓 등록 상품 수정(미노출 , 노출)
  @Post('/status/show/:id')
  async updateShowStatus(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('isShow') isShow: boolean,
    @Body('issueComment') issueComment: string,
  ) {
    try {
      // 마켓 상품 , 지분 상품 상태 검증 및 변경
      const marketItem = await this.adminMarketService.getEnttityById(id);
      if (!marketItem) {
        return false;
      }
      if (marketItem.isDeleted) {
        return false;
      }
      const stockItem = await this.adminStockService.getEntityByRawVideoId(
        marketItem.rawVideo.id,
      );

      if (!marketItem.isShow && isShow) {
        await this.adminMarketService.rollbackShowStatus(id);
      } else {
        const { isSuccessful, isSendEmail, isDeleteStockOrder } =
          await this.adminMarketService.updateShowStatus(
            id,
            isShow,
            issueComment,
          );

        // 지분 마켓에 등록된 상품인 경우 지분 마켓 상품 상태 변경 및 주문건 삭제
        if (isSuccessful && isDeleteStockOrder) {
          // SEND MESSAGE QUEUE(APP MATCHING DAEMON) - 미체결된 지분 검증 후 삭제 및 포인트 반환
          const message = {
            type: STOCK_MESSAGE_TYPE.HIDE_ITEM,
            id: stockItem.id,
            userId: marketItem.user.id,
          };

          const defferedResult =
            await this.adminDaemonService.defferedResult<DaemonOrderDefaultResultDto>(
              this.stockMatchingInQueueUrl,
              this.stockMatchingOutQueueUrl,
              message,
              async (message) => message,
            );

          if (!defferedResult) {
            throw new ApiHttpException(
              RESPONSE_CODE.MESSAGE_QUEUE_ERROR,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (defferedResult.retCode !== RESPONSE_CODE.SUCCESS) {
            throw new ApiHttpException(
              defferedResult.retCode,
              HttpStatus.BAD_REQUEST,
            );
          }

          // SEND MESSAGE QUEUE(APP STOCK GATEWAT DAEOMN) - 미노출로 인해 front 상태 변경을 위한 메시지 전송
          await this.adminDaemonService.sendNotCache(
            this.stockGatewayQueueUrl,
            {
              eventName: STOCK_EVENT.HIDE_FAST_BOOK,
              data: {
                stockId: stockItem.id,
              },
            },
          );

          // 2025.03.29 - 아래 기능은 미구현 (stockOrderCancelEntity에 기록 되니 참고)
          // SEND EMAIL (사용자 조회) - 미체결된 지분 주문건 삭제로 인한 메일 발송
          // const holderInfo = await this.adminStockService.getHideStockOrderLive(
          //   stockItem.id,
          // );
          // if (holderInfo.length > 0) {
          //   const emailList = holderInfo.map(async (item) => {
          //   });

          //   await Promise.all(emailList);
          // }
        }

        // 노출 -> 미노출 시 메일 발송
        if (isSuccessful && isSendEmail) {
          const isSendEmail = await this.sendEmail(
            marketItem.user.email,
            marketItem.user.realName,
            marketItem.title,
            String(marketItem.createdAt),
            issueComment,
          );

          if (!isSendEmail) {
            throw new ApiHttpException(
              RESPONSE_CODE.AWS_SES_EMAIL_SEND_ERROR,
              HttpStatus.BAD_REQUEST,
            );
          }

          return true;
        }
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

  @Post('/delete/:id')
  async updateDeleteStatus(
    @Req() req: Request,
    @Param('id') id: number,
    @Body('isDeleted') isDeleted: boolean,
  ) {
    try {
      // 마켓 상품 , 지분 상품 상태 검증 및 변경
      const marketItem = await this.adminMarketService.getEnttityById(id);
      if (!marketItem) {
        return false;
      }

      const prevDeleteStatus = marketItem.isDeleted;
      if (prevDeleteStatus == isDeleted) {
        return false;
      }
      await this.adminMarketService.updateDeleteStatus(id, isDeleted);

      const stockItem = await this.adminStockService.getEntityByRawVideoId(id);
      if (stockItem) {
        await this.adminStockService.updateDeleteStatus(
          stockItem.id,
          isDeleted,
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

  private async sendEmail(
    email: string,
    realName: string,
    title: string,
    createdAt: string,
    issueComment: string,
  ) {
    let customerEmailHTML = await readFile(
      join(__dirname, '../templates/market_mail_disable_item.html'),
      'utf8',
    );
    // html ${} 값 변경 = 고객 이름
    customerEmailHTML = customerEmailHTML.replace('[$_USERNAME_$]', realName);
    // html ${} 값 변경 = 문의글
    customerEmailHTML = customerEmailHTML.replace('[$_TITLE_$]', title);
    // html ${} 값 변경 = 답변글
    customerEmailHTML = customerEmailHTML.replace(
      '[$_DATE_$]',
      `${this.commonService.toDateFormat(createdAt)}`,
    );
    customerEmailHTML = customerEmailHTML.replace(
      '[$_REASON_$]',
      issueComment.replace(/\n/g, '<br>'),
    );

    const isSuccessful = await this.awsSesService.sendEmail(
      this.fromEmail,
      email,
      'MCLOOSE 영상 미노출 메일 입니다.',
      customerEmailHTML,
    );

    return isSuccessful;
  }
}
