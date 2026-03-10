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
  SearchUserDto,
  SigninAdminDto,
  UpdateAdminDto,
} from '../../dto/admin.dto';
import { Request } from 'express';
import { AdminAllAuthGuard, AdminSuperAuthGuard } from '../admin.auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { AdminEntity } from '../../entities/admin.entity';
import { CommonService } from '../../services/common.service';
import { RESPONSE_CODE } from '../../constant';

@Controller('/user')
export class ApiAdminUserController {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    private readonly adminUserService: AdminUserService,
  ) { }

  private readonly logger = new Logger(ApiAdminUserController.name);

  // 고객 리스트 조회
  // TODO: 어드민 수정 이후 추후 다시 확인 해야함
  @Get('/list')
  @UseGuards()
  async list(
    @Req() @Req() req: Request,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.list(
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

  // 고객 정보 상세 조회
  @Get('/detail/:id')
  async getDetail(@Req() req: Request, @Param('id') id: number) {
    try {
      return await this.adminUserService.getDefaultDetail(id);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고개 정보 상세 조회 - 거래 내역 조회
  @Get('/usage/list/:id')
  async getUsageList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getUsageHistoryList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit()
      )
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 보유 상품 - 제작 영상(프롬프트로 생성한 영상 조회)
  @Get('/raw_video/list/:id')
  @UseGuards()
  async getRawVideoList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getRawVideoList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고개 정보 상세 조회 - 보유 상품 (구매 내역 조회)
  @Get('/market/purchase/list/:id')
  @UseGuards()
  async getPurchaseList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getPurchaseMarketHistoryList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 보유 상품 (동영상 상품)
  @Get('/market/register/list/:id')
  @UseGuards()
  async getMarketSellList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getRegisteredMarketList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 보유 상품 (지분 상품)
  @Get('/stock/list/:id')
  @UseGuards()
  async getStockList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getMatchingHistory(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 입출금 내역 조회
  @Get('/payment/list/:id')
  @UseGuards()
  async getPaymentList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getPaymentHistoryList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 고객 문의 내역 조회
  @Get('/support/list/:id')
  @UseGuards()
  async getSupportList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getSupportCustomerList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 고객 메모
  @Get('/memo/list/:id')
  @UseGuards()
  async getMemoList(
    @Req() req: Request,
    @Param('id') id: number,
    @Query() searchUserDto: SearchUserDto,
  ) {
    try {
      return await this.adminUserService.getMemoList(
        id,
        searchUserDto.getOffset(),
        searchUserDto.getLimit(),
      );
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 고객 정보 상세 조회 - 고객 메모 등록
  @Post('/memo/create/:id')
  @UseGuards(AdminAllAuthGuard)
  async createMemo(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() body: any,
  ) {
    try {
      const admin = req.user as AdminEntity;
      const memo = req.body.content;
      return await this.adminUserService.createMemo(id, memo, admin);
    } catch (error) {
      this.logger.error(error);
      throw new ApiHttpException(
        error.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
