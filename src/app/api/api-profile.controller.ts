/**
 * TODO: 필수 사항
 * 모든 리스트 조회간 createdAt, updatedAt, deletedAt KST로 변경
 */

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { RESPONSE_CODE, STOCK_ACCOUNT_MAX_REMAIN_VOLUME } from '../../constant';
import { AppApiAuthGuard } from '../app.auth.guard';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';
import { TransactionActionService } from '../../services/transaction-action.service';
import {
  ChartQueryDto,
  OutFlowHistoryDto,
  ProfileMarketPurchaseHistoryQueryDto,
  ProfileOutFlowHistoryQueryDto,
  ProfileQueryDto,
} from '../../dto/profile.dto';
import { CommonService } from '../../services/common.service';
import { StockAccountService } from '../../services/stock/stock-account.service';
import { UserService } from '../../services/user.service';
import { StockItemService } from '../../services/stock/stock-item.service';

@Controller('/api/v1/profile')
@UseGuards(AppApiAuthGuard)
export class ApiProfileController {
  constructor(
    private readonly transactionActionService: TransactionActionService,
    private readonly stockItemService: StockItemService,
    private readonly stockAccountService: StockAccountService,
    private readonly commonservice: CommonService,
    private readonly userService: UserService,
  ) {}

  @Get('/overview/summary')
  async getSummary(@Req() req: Request) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 생성 프로젝트 수 조회
      const rawVideoCount =
        await this.transactionActionService.getRawVideoCount(user);

      // 미체결 지분 수 조회
      const orderLiveCount =
        await this.transactionActionService.getOrderLiveStockCount(user);

      //
      const completedMarketCount =
        await this.transactionActionService.getCompleteMarketHistoryCount(
          null,
          null,
          user,
        );

      //
      const isExistOutflow =
        (await this.transactionActionService.getOutflowPendingList(user))
          .length > 0
          ? true
          : false;

      return {
        rawVideoCount,
        orderLiveCount,
        completedMarketCount,
        isExistOutflow,
      };
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/overview/montly-chart')
  async getSummaryMontlyChart(@Req() req: Request) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.transactionActionService.getSummaryMonthlyChart(user);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/overview/most-purchase-list')
  async getMorePurchaseHistory(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.transactionActionService.getTopPurchaseMarketItemList(
        profileQueryDto.date_from,
        profileQueryDto.date_to,
        user,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------- market -------------------
  @Get('/market/summary')
  async getMarketSummary(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 신규 판매 등록 건 market_item COUNT.. userID = userId AND dateFrom < createdAt <  dateTo
      const newMarketCount =
        await this.transactionActionService.getNewMarketItemCount(
          profileQueryDto.date_from,
          profileQueryDto.date_to,
          user,
        );

      // 판매 완료 건 market_history COUNT.. seller_user_id = userId AND dateFrom < createdAt <  dateTo
      const completeMarketCount =
        await this.transactionActionService.getCompleteMarketHistoryCount(
          profileQueryDto.date_from,
          profileQueryDto.date_to,
          user,
        );

      // 발생 수익
      const totalProfit =
        await this.transactionActionService.getTotalMarketProfit(
          profileQueryDto.date_from,
          profileQueryDto.date_to,
          user,
        );

      return {
        newMarketCount,
        completeMarketCount,
        totalProfit,
      };
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // TODO: 미정 항목
  @Get('/market/profit-chart')
  async getMarketProfitChart(
    @Req() req: Request,
    @Query() chartQueryDto: ChartQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 판매내역 요약을 조회합니다.
      const summary = await this.transactionActionService.getMarketProfitChart(
        chartQueryDto.date_from || null,
        chartQueryDto.date_to || null,
        user,
        chartQueryDto.is_monthly || false,
      );
      return summary;
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/market/purchase-history')
  async getPurchaseHistory(
    @Req() req: Request,
    @Query()
    profileMarketPurchaseHistoryQueryDto: ProfileMarketPurchaseHistoryQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자의 구매내역을 조회합니다.
      const data = await this.transactionActionService.purchaseMarketHistory(
        profileMarketPurchaseHistoryQueryDto.available_download || null,
        profileMarketPurchaseHistoryQueryDto.keyword || null,
        profileMarketPurchaseHistoryQueryDto.date_from || null,
        profileMarketPurchaseHistoryQueryDto.date_to || null,
        profileMarketPurchaseHistoryQueryDto.getOffset(),
        profileMarketPurchaseHistoryQueryDto.getLimit(),
        user,
      );
      if (data.totalCount !== 0) {
        data.itemList.forEach((item) => {
          item.createdAt = this.commonservice.convertDateFormat(item.createdAt);
          item.availableDownloadAt = this.commonservice.convertDateFormat(
            item.availableDownloadAt,
          );
        });
      }

      return data;
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/market/item-list')
  async getMarketitemList(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 판매내역을 조회합니다.
      const data =
        await this.transactionActionService.getRegisterMarketItemList(
          profileQueryDto.getOffset(),
          profileQueryDto.getLimit(),
          user,
        );
      if (data.totalCount !== 0) {
        data.itemList.forEach((item) => {
          item.createdAt = this.commonservice.convertDateFormat(item.createdAt);
        });
      }

      return data;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/market/sales-history')
  async getSalesHistory(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 판매내역을 조회합니다.
      return await this.transactionActionService.getSalesMarketHistoryList(
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        profileQueryDto.keyword || null,
        profileQueryDto.date_from,
        profileQueryDto.date_to,
        user,
      );
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  // ------------------- market -------------------

  // ------------------- stock -------------------
  @Get('/stock/summary')
  async getStockSummary(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 신규 구매 지분 건 match COUNT.. buyer_user_id = userId AND dateFrom < createdAt <  dateTo
      const newStockCount =
        await this.transactionActionService.getNewBuyStockMatchCount(
          profileQueryDto.date_from,
          profileQueryDto.date_to,
          user,
        );

      // 미체결 지분 건 order_live COUNT.. userId = userId
      const orderLiveCount =
        await this.transactionActionService.getOrderLiveStockCount(user);

      // 발생 수익 profit_payout_history SUM(profit_amount)... stock_holder_id = userId AND dateFrom < createdAt <  dateTo
      const totalProfit =
        await this.transactionActionService.getTotalProfitPayoutHistory(
          profileQueryDto.date_from,
          profileQueryDto.date_to,
          user,
        );

      // 보유 지분 stock_account COUNT.. user_id = userId AND volume > 0
      const stockAccountCount =
        await this.transactionActionService.getStockAccountCount(user);

      return {
        newStockCount,
        orderLiveCount,
        totalProfit,
        stockAccountCount,
      };
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/profit-chart')
  async getPayoutProfitChart(
    @Req() req: Request,
    @Query() chartQueryDto: ChartQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 판매내역 요약을 조회합니다.
      const summary = await this.transactionActionService.getStockProfitChart(
        chartQueryDto.date_from || null,
        chartQueryDto.date_to || null,
        user,
        chartQueryDto.is_monthly || false,
      );

      return summary;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/account-list')
  async getStockAccountList(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 주식 구매내역을 조회합니다.
      return await this.transactionActionService.getStockAccountList(
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        profileQueryDto.sort || null,
        user,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/item-list')
  async getStockItemList(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자의 주식 구매내역을 조회합니다.
      const data = await this.transactionActionService.getRegisterStockItemList(
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        user,
      );
      return data;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/item/detail/:stockItemId')
  async getStockItemDetail(
    @Req() req: Request,
    @Param('stockItemId') stockItemId: number,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자의 주식 구매내역을 조회합니다.
      const stockItem = await this.stockItemService.getEntityById(stockItemId);
      if (!stockItem || stockItem.isDeleted) {
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ITEM_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }

      const stockAccount =
        await this.stockAccountService.getEntityByUserAndStockItem(
          user,
          stockItem,
          null,
        );

      let remainStockVolume = 0;
      if (stockAccount) {
        if (Number(stockAccount.volume) >= STOCK_ACCOUNT_MAX_REMAIN_VOLUME) {
          remainStockVolume =
            Number(stockAccount.volume) - STOCK_ACCOUNT_MAX_REMAIN_VOLUME;
        } else {
          remainStockVolume = Number(stockAccount.volume);
        }
      }

      return {
        id: stockItem.id,
        stockItemId: stockItem.id,
        volume: remainStockVolume,
      };
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/order-live-list')
  async getStockOrderLiveList(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 주식 구매내역을 조회합니다.
      const data = await this.transactionActionService.getOrderLiveList(
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        user,
      );
      return data;
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/stock/sell-history')
  async getStockMatchingList(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 주식 구매내역을 조회합니다.
      const data = await this.transactionActionService.getSellMatchHistory(
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        profileQueryDto.keyword || null,
        profileQueryDto.date_from || null,
        profileQueryDto.date_to || null,
        user,
      );
      return data;
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------- stock -------------------

  // ------------------- payment -------------------
  @Get('/account/summary')
  async getAccountSummary(@Req() req: Request) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 계좌 요약을 조회합니다.
      return await this.transactionActionService.getAccountList(user);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/payment/history')
  async getPaymentHistory(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 사용자의 출금내역을 조회합니다.
      const data = await this.transactionActionService.getPaymentHistory(
        profileQueryDto.date_from || null,
        profileQueryDto.date_to || null,
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        user,
      );
      return data;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/usage-history')
  async getUsageHistory(
    @Req() req: Request,
    @Query() profileQueryDto: ProfileQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      // 사용자의 사용내역을 조회합니다.
      return await this.transactionActionService.getUsageHistory(
        profileQueryDto.date_from || null,
        profileQueryDto.date_to || null,
        profileQueryDto.getOffset(),
        profileQueryDto.getLimit(),
        user,
      );
    } catch (err) {
      console.log(err);

      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  // ------------------- payment -------------------

  // ------------------- outflow -------------------
  @Post('/outflow')
  async createOutflow(
    @Req() req: Request,
    @Body() outflowDto: OutFlowHistoryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }
      const isSameBankCode = user.bankCode === outflowDto.regBankCode;
      const isSameBankName = user.bankName === outflowDto.regBankName;
      const isSameBankAccountNumber =
        user.bankAccountNumber === outflowDto.regBankAccountNumber;

      //  존재 하지 않는 계좌 정보가 있는 경우
      if (!isSameBankCode || !isSameBankName || !isSameBankAccountNumber) {
        const result = await this.userService.updateBanckInfo(
          user,
          outflowDto.regBankCode,
          outflowDto.regBankName,
          outflowDto.regBankAccountNumber,
        );

        if (!result) {
          throw new ApiHttpException(
            RESPONSE_CODE.USER_BANK_ACCOUNT_FAILED,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const expectedAmount =
        Number(outflowDto.originAmount) - Number(outflowDto.fee);
      if (expectedAmount !== Number(outflowDto.expectedAmount)) {
        throw new ApiHttpException(
          RESPONSE_CODE.OUTFLOW_EXPECTED_AMOUNT_NOT_MATCH,
          HttpStatus.BAD_REQUEST,
        );
      }

      // 환불 정산 정보 생성
      const isCreate = await this.transactionActionService.createOutflow(
        outflowDto,
        user,
      );

      if (!isCreate) {
        throw new ApiHttpException(
          RESPONSE_CODE.OUTFLOW_CREATE_FAILED,
          HttpStatus.BAD_REQUEST,
        );
      }

      return true;
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/outflow/pending-list')
  async getOutflowPendingList(@Req() req: Request) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.transactionActionService.getOutflowPendingList(user);
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('/outflow/list')
  async getOutflowList(
    @Req() req: Request,
    @Query() profileOutFlowHistoryQueryDto: ProfileOutFlowHistoryQueryDto,
  ) {
    try {
      const user = req.user as UserEntity;
      if (!user) {
        throw new ApiHttpException(
          RESPONSE_CODE.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
        );
      }

      return await this.transactionActionService.getOutflowList(
        profileOutFlowHistoryQueryDto.status || null,
        profileOutFlowHistoryQueryDto.type || null,
        profileOutFlowHistoryQueryDto.date_from || null,
        profileOutFlowHistoryQueryDto.date_to || null,
        profileOutFlowHistoryQueryDto.getOffset(),
        profileOutFlowHistoryQueryDto.getLimit(),
        user,
      );
    } catch (err) {
      throw new ApiHttpException(
        err.response || RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  // ------------------- outflow -------------------
}
