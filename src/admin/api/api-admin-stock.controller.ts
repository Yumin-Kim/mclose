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
import { AdminUserService } from '../../services/admin/admin-user.service';
import {
  CreateAdminDto,
  SearchAdminDto,
  SearchStockDto,
  SearchUserDto,
  SigninAdminDto,
  UpdateAdminDto,
} from '../../dto/admin.dto';
import { Request } from 'express';
import { AdminCommonGuard } from '../admin.auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AdminEntity } from '../../entities/admin.entity';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE } from '../../constant';
import { AdminStockService } from '../../services/admin/admin-stock.service';

@Controller('/stock')
@UseGuards(AdminCommonGuard)
export class ApiAdminStockController {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly adminStockService: AdminStockService,
  ) {}

  private readonly logger = new Logger(ApiAdminStockController.name);

  // 지분 상품 관리
  @Get('/list')
  @UseGuards()
  async list(@Req() @Req() req: Request, @Query() query: SearchStockDto) {
    try {
      return await this.adminStockService.list(
        query.getOffset(),
        query.getLimit(),
        query,
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 지분 등록 상품 상세 조회
  @Get('/detail/:id')
  @UseGuards()
  async getDetail(@Req() @Req() req: Request, @Param('id') id: number) {
    try {
      return await this.adminStockService.getDetail(id);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 지분 등록 상품 수정(미노출 , 노출)
  // TODO: 상태 변경시 지분 상품 존재 동시에 변경
  @Post('/update/status')
  @UseGuards()
  async updateStatus(@Req() @Req() req: Request) {
    try {
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
