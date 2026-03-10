import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PagenationRes } from '../../common/response/response-page';
import { Between, DataSource, Like, MoreThan } from 'typeorm';
import { PaymentHistoryRepository } from '../../repositories/payment-history.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { SearchPaymentDto } from '../../dto/admin.dto';
import { OutflowHistoryEntityRepository } from '../../repositories/outflow-history.repository';
import { UsageHistoryRepository } from '../../repositories/usage-history.repository';
import {
  ACCOUNT_CURRENCY,
  ADMIN_MANUAL_OUTFLOW_METHOD,
  ADMIN_MANUAL_OUTFLOW_PROVIDER,
  ADMIN_MANUAL_OUTFLOW_UUID,
  OUTFLOW_HISTORY_STATUS,
  PAYMENT_HISTORY_STATUS,
  USAGE_HISTORY_TYPE,
} from '../../constant';
import { CommonService } from '../common.service';
import { OutflowHistoryEntity } from '../../entities/outflow-history.entity';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { PromptHistoryEntity } from '../../entities/prompt-history.entity';
import { UserEntity } from '../../entities/user.entity';
import { RawVideoEntity } from '../../entities/raw-video.entity';
import { AccountService } from '../account.service';
import { AccountHistoryService } from '../account-history.service';
import { PaymentService } from '../payment.service';
import { PaymentHistoryEntity } from '../../entities/payment-history.entity';
@Injectable()
export class AdminPaymentService {
  private readonly logger = new Logger(AdminPaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    private readonly paymentHistoryRepository: PaymentHistoryRepository,
    private readonly outflowHistoryEntityRepository: OutflowHistoryEntityRepository,
    private readonly usageHistoryRepository: UsageHistoryRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
    private readonly accountHistoryService: AccountHistoryService,
  ) {}
  /**
   * 매출 내역 조회
   * @param page
   * @param limit
   * @param searchPaymentDto
   * @returns
   */
  async getUsageHistoryList(
    page: number,
    limit: number,
    searchPaymentDto: SearchPaymentDto,
  ) {
    let list = [];
    const dateFrom = this.commonService.startOfDay(searchPaymentDto.date_from);
    const dateTo = this.commonService.endOfDay(searchPaymentDto.date_to);

    const totalQuery =
      this.usageHistoryRepository.createQueryBuilder('usageHistory');

    const query = this.usageHistoryRepository
      .createQueryBuilder('usageHistory')
      .leftJoinAndMapOne(
        'usageHistory.marketItem',
        MarketItemEntity,
        'marketItem',
        'usageHistory.type = :usageTypeToMarket AND usageHistory.refId = marketItem.id',
        { usageTypeToMarket: USAGE_HISTORY_TYPE.MARKET },
      )
      .leftJoinAndMapOne(
        'usageHistory.marketItem.user',
        UserEntity,
        'marketItemSeller',
        'marketItem.user.id = marketItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.stockItem',
        StockItemEntity,
        'stockItem',
        'usageHistory.type = :usageTypeToStock AND usageHistory.refId = stockItem.id',
        { usageTypeToStock: USAGE_HISTORY_TYPE.STOCK_MATCH_BUY },
      )
      // stockItem.user 접근
      .leftJoinAndMapOne(
        'usageHistory.stockItem.user',
        UserEntity,
        'stockItemSeller',
        'stockItem.user.id = stockItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.promptHistory',
        PromptHistoryEntity,
        'promptHistory',
        'usageHistory.type = :usageTypeToPrompt AND usageHistory.refId = promptHistory.id',
        { usageTypeToPrompt: USAGE_HISTORY_TYPE.PROMPT },
      );

    if (searchPaymentDto.real_name) {
      query.leftJoinAndMapOne(
        'usageHistory.user',
        UserEntity,
        'user',
        'user.id = usageHistory.userId',
      );
    } else {
      query.leftJoinAndMapOne(
        'usageHistory.user',
        UserEntity,
        'user',
        'user.id = usageHistory.user.id',
      );
    }

    if (dateFrom && dateTo) {
      query.andWhere('usageHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom,
        dateTo: dateTo,
      });

      totalQuery.andWhere(
        'usageHistory.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      );
    }

    if (searchPaymentDto.currency.toUpperCase() !== 'ALL') {
      query.andWhere('usageHistory.currency = :currency', {
        currency: searchPaymentDto.currency,
      });
      totalQuery.andWhere('usageHistory.currency = :currency', {
        currency: searchPaymentDto.currency,
      });
    }

    query
      .offset(page)
      .limit(limit)
      .orderBy('usageHistory.id', 'DESC')
      .select([
        'usageHistory.id',
        'usageHistory.type',
        'usageHistory.amount',
        'usageHistory.currency',
        'usageHistory.createdAt',
        'COALESCE(marketItem.id, stockItem.id, promptHistory.id) as item_id',
        'COALESCE(marketItem.title, stockItem.title, NULL) as title',
        'user.realName',
        'user.loginId',
        'COALESCE(marketItemSeller.realName, stockItemSeller.realName , user.realName) as seller_real_name',
        'COALESCE(marketItemSeller.loginId, stockItemSeller.loginId , user.loginId) as seller_login_id',
      ]);

    const entityList = await query.getRawMany();
    const totalCount = await totalQuery.getCount();

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.usageHistory_id,
          type: entity.usageHistory_type,
          amount: entity.usageHistory_amount,
          currency: entity.usageHistory_currency,
          createdAt: entity.usageHistory_created_at,
          itemId: entity.item_id,
          title: entity.title,
          buyerRealName: entity.user_real_name,
          buyerLoginId: entity.user_login_id,
          sellerRealName: entity.seller_real_name,
          sellerLoginId: entity.seller_login_id,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  async getUsageHistorySummary(searchPaymentDto: SearchPaymentDto) {
    const dateFrom = this.commonService.startOfDay(searchPaymentDto.date_from);
    const dateTo = this.commonService.endOfDay(searchPaymentDto.date_to);
    const query = this.usageHistoryRepository
      .createQueryBuilder('usage_history')
      .select('SUM(amount)', 'total')
      .where('amount > 0')
      .andWhere('created_at BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });

    if (searchPaymentDto.currency.toUpperCase() !== 'ALL') {
      query.andWhere('currency = :currency', {
        currency: searchPaymentDto.currency,
      });
    }

    if (searchPaymentDto.real_name) {
      query.andWhere('user.real_name LIKE :realName', {
        realName: `%${searchPaymentDto.real_name}%`,
      });
    }

    const result = await query.getRawOne();

    if (result && result.total) {
      return {
        totalAmount: result.total || 0,
      };
    }

    return { totalAmount: 0 };
  }

  /**
   * 매출 내역 조회
   * @param page
   * @param limit
   * @param searchPaymentDto
   * @returns
   */
  async getUsagePerformenceList(
    page: number,
    limit: number,
    searchPaymentDto: SearchPaymentDto,
  ) {
    let list = [];
    const dateFrom = this.commonService.startOfDay(searchPaymentDto.date_from);
    const dateTo = this.commonService.endOfDay(searchPaymentDto.date_to);

    const totalQuery =
      this.usageHistoryRepository.createQueryBuilder('usageHistory');

    const query = this.usageHistoryRepository
      .createQueryBuilder('usageHistory')
      .leftJoinAndMapOne(
        'usageHistory.marketItem',
        MarketItemEntity,
        'marketItem',
        'usageHistory.type = :usageTypeToMarket AND usageHistory.refId = marketItem.id',
        { usageTypeToMarket: USAGE_HISTORY_TYPE.MARKET },
      )
      .leftJoinAndMapOne(
        'usageHistory.marketItem.user',
        UserEntity,
        'marketItemSeller',
        'marketItem.user.id = marketItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.marketItem.rawVideo',
        RawVideoEntity,
        'marketItemRawVideo',
        'marketItem.rawVideo.id = marketItemRawVideo.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.stockItem',
        StockItemEntity,
        'stockItem',
        'usageHistory.type = :usageTypeToStock AND usageHistory.refId = stockItem.id',
        { usageTypeToStock: USAGE_HISTORY_TYPE.STOCK_MATCH_BUY },
      )
      // stockItem.user 접근
      .leftJoinAndMapOne(
        'usageHistory.stockItem.user',
        UserEntity,
        'stockItemSeller',
        'stockItem.user.id = stockItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.stockItem',
        RawVideoEntity,
        'stockItemRawVideo',
        'stockItem.rawVideo.id = stockItemRawVideo.id',
      )
      .where('usageHistory.type != :type', {
        type: USAGE_HISTORY_TYPE.PROMPT,
      });

    if (searchPaymentDto.real_name) {
      query.orWhere('marketItemSeller.real_name LIKE :realName', {
        realName: `%${searchPaymentDto.real_name}%`,
      });
      query.orWhere('stockItemSeller.real_name LIKE :realName', {
        realName: `%${searchPaymentDto.real_name}%`,
      });
    }

    if (searchPaymentDto.title) {
      query.orWhere('marketItem.title LIKE :title', {
        title: `%${searchPaymentDto.title}%`,
      });

      query.orWhere('stockItem.title LIKE :title', {
        title: `%${searchPaymentDto.title}%`,
      });
    }

    if (searchPaymentDto.login_id) {
      query.orWhere('marketItemSeller.login_id LIKE :loginId', {
        loginId: `%${searchPaymentDto.login_id}%`,
      });

      query.orWhere('stockItemSeller.login_id LIKE :loginId', {
        loginId: `%${searchPaymentDto.login_id}%`,
      });
    }

    if (dateFrom && dateTo) {
      query.andWhere('usageHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dateFrom,
        dateTo: dateTo,
      });

      totalQuery.andWhere(
        'usageHistory.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: dateFrom,
          dateTo: dateTo,
        },
      );
    }

    query
      .offset(page)
      .limit(limit)
      .orderBy('usageHistory.id', 'DESC')
      .select([
        'usageHistory.id',
        'usageHistory.type',
        'usageHistory.amount',
        'usageHistory.currency',
        'usageHistory.createdAt',
        'COALESCE(marketItem.id, stockItem.id) as item_id',
        'COALESCE(marketItem.title, stockItem.title) as title',
        'COALESCE(marketItemSeller.realName, stockItemSeller.realName) as real_name',
        'COALESCE(marketItemSeller.loginId, stockItemSeller.loginId) as login_id',
        'COALESCE(marketItemRawVideo.videoResolution, stockItemRawVideo.videoResolution) as video_resolution',
        'COALESCE(marketItemRawVideo.videoRatio, stockItemRawVideo.videoRatio) as video_ratio',
        'COALESCE(marketItem.viewCnt, stockItem.viewCnt) as view_cnt',
        'COALESCE(marketItem.purchaseCnt, stockItem.matchCnt) as match_cnt',
      ]);

    const entityList = await query.getRawMany();
    const totalCount = await totalQuery.getCount();

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.usageHistory_id,
          type: entity.usageHistory_type,
          amount: entity.usageHistory_amount,
          currency: entity.usageHistory_currency,
          createdAt: entity.usageHistory_created_at,
          itemId: entity.item_id,
          title: entity.title,
          realName: entity.real_name,
          loginId: entity.login_id,
          videoRatio: entity.video_ratio,
          videoResolution: entity.video_resolution,
          viewCnt: entity.view_cnt,
          matchCnt: entity.match_cnt,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  /**
   * 충전 내역 조회
   * @param page
   * @param limit
   * @param searchPaymentDto
   * @returns
   */
  async getChargeList(
    page: number,
    limit: number,
    searchPaymentDto: SearchPaymentDto,
  ) {
    const { status, real_name, currency, date_from, date_to } =
      searchPaymentDto;
    const whereCondition = {
      amount: MoreThan(0),
      status: PAYMENT_HISTORY_STATUS.PAID,
    };

    if (real_name) {
      whereCondition['user.real_name'] = {
        $like: `%${real_name}%`,
      };
    }
    if (currency.toUpperCase() !== 'ALL') {
      whereCondition['currency'] = currency;
    }
    if (date_from && date_to) {
      const dateFrom = this.commonService.startOfDay(date_from);
      const dateTo = this.commonService.endOfDay(date_to);
      whereCondition['createdAt'] = Between(dateFrom, dateTo);
    }

    const [result, total] = await this.paymentHistoryRepository.findAndCount({
      relations: ['user'],
      where: whereCondition,
      skip: page,
      take: limit,
      order: {
        id: 'DESC',
      },
    });
    return new PagenationRes(page, limit, total, result);
  }

  /**
   * 충전 내역 요약 조회(기간 범위 지정 총 합산 금액)
   * @param searchPaymentDto
   * @returns
   */
  async getChargeSummary(searchPaymentDto: SearchPaymentDto) {
    const dateFrom = this.commonService.startOfDay(searchPaymentDto.date_from);
    const dateTo = this.commonService.endOfDay(searchPaymentDto.date_to);
    let result = null;

    if (searchPaymentDto.currency.toUpperCase() === 'ALL') {
      result = await this.paymentHistoryRepository
        .createQueryBuilder('payment_history')
        .select('SUM(amount)', 'total')
        .where('amount > 0')
        .andWhere('status = :status', { status: PAYMENT_HISTORY_STATUS.PAID })
        .andWhere('created_at BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .getRawOne();
    } else {
      result = await this.paymentHistoryRepository
        .createQueryBuilder('payment_history')
        .select('SUM(amount)', 'total')
        .where('amount > 0')
        .andWhere('status = :status', { status: PAYMENT_HISTORY_STATUS.PAID })
        .andWhere('created_at BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .andWhere('currency = :currency', {
          currency: searchPaymentDto.currency,
        })
        .getRawOne();
    }

    if (result && result.total) {
      return {
        totalAmount: result.total || 0,
      };
    }

    return { totalAmount: 0 };
  }

  /**
   * 환불 내역 조회
   * @param page
   * @param limit
   * @param searchPaymentDto
   * @returns
   */
  async getOutflowList(
    page: number,
    limit: number,
    searchPaymentDto: SearchPaymentDto,
  ) {
    const { real_name, date_from, date_to } = searchPaymentDto;
    const whereCondition = {};

    const dateFrom = this.commonService.startOfDay(date_from);
    const dateTo = this.commonService.endOfDay(date_to);

    if (real_name) {
      whereCondition['user.real_name'] = {
        Like: `%${real_name}%`,
      };
    }
    if (date_from && date_to) {
      whereCondition['createdAt'] = Between(dateFrom, dateTo);
    }
    if (searchPaymentDto.status.toUpperCase() !== 'ALL') {
      whereCondition['status'] = searchPaymentDto.status;
    }

    const [result, total] =
      await this.outflowHistoryEntityRepository.findAndCount({
        relations: ['user'],
        where: whereCondition,
        skip: page,
        take: limit,
        order: {
          id: 'DESC',
        },
      });

    return new PagenationRes(page, limit, total, result);
  }

  async getOutflowSummary(searchPaymentDto: SearchPaymentDto) {
    const dateFrom = this.commonService.startOfDay(searchPaymentDto.date_from);
    const dateTo = this.commonService.endOfDay(searchPaymentDto.date_to);

    let result = null;

    if (searchPaymentDto.status.toUpperCase() === 'ALL') {
      result = await this.outflowHistoryEntityRepository
        .createQueryBuilder('outflow_history')
        .select('SUM(expected_amount)', 'total')
        .andWhere('created_at BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .getRawOne();
    } else {
      result = await this.outflowHistoryEntityRepository
        .createQueryBuilder('outflow_history')
        .select('SUM(expected_amount)', 'total')
        .andWhere('created_at BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .andWhere('status = :status', { status: searchPaymentDto.status })
        .getRawOne();
    }

    if (result && result.total) {
      return {
        totalAmount: result.total || 0,
      };
    }

    return { totalAmount: 0 };
  }

  /**
   * 환불 정산 내역 상세 조회
   * @param outflowId
   * @returns
   */
  async getOutFlowDetail(outflowId) {
    const outFlowResult = await this.outflowHistoryEntityRepository.findOne({
      relations: ['user'],
      where: {
        id: outflowId,
      },
    });

    if (!outFlowResult) {
      return null;
    }

    const marketBalance = await this.accountRepository.findOne({
      where: {
        user: {
          id: outFlowResult.user.id,
        },
        currency: ACCOUNT_CURRENCY.CL,
      },
    });

    const stockBalance = await this.accountRepository.findOne({
      where: {
        user: {
          id: outFlowResult.user.id,
        },
        currency: ACCOUNT_CURRENCY.OS,
      },
    });

    return {
      ...outFlowResult,
      marketBalance: marketBalance.balance || 0,
      stockBalance: stockBalance.balance || 0,
    };
  }

  /**
   * 환불 , 정산 내역 상태 변경
   * 2025.03.24
   * 정산하기 기능만 제공
   * 정산은 아래와 같은 상태에서 동작한다.
   * case 1. 대기 , 진행일 경우만에만 취소가 가능하다. X
   * case 2. 완료 상태에서는 취소가 불가능하다. X
   * @param outflowId
   * @param status
   * @returns
   */
  async updateOutFlowStatus(outflowId, status) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let isSuccessful = true;
    let isSendEmail = false;
    try {
      const result = await queryRunner.manager.findOne(OutflowHistoryEntity, {
        relations: ['user'],
        where: {
          id: outflowId,
        },
      });

      if (!result) {
        isSuccessful = false;
      }

      const user = result.user;
      const prevStatus = result.status;
      if (prevStatus === status) {
        return {
          isSuccessful: false,
        };
      }

      // 대기 , 진행일 경우만에만 취소가 가능하다.
      if (
        status === OUTFLOW_HISTORY_STATUS.CANCELED &&
        prevStatus === OUTFLOW_HISTORY_STATUS.CONFIRMED
      ) {
        isSuccessful = false;
      } else {
        switch (status) {
          case OUTFLOW_HISTORY_STATUS.PENDING:
          case OUTFLOW_HISTORY_STATUS.PROGRESS:
            // 대기, 진행 상태 변경
            await queryRunner.manager.update(
              OutflowHistoryEntity,
              { id: outflowId },
              { status },
            );
            break;
          case OUTFLOW_HISTORY_STATUS.CONFIRMED:
            // 정산 완료 처리
            await queryRunner.manager.update(
              OutflowHistoryEntity,
              { id: outflowId },
              {
                status,
                processAt: () => `CURRENT_TIMESTAMP`,
              },
            );

            // 출금 내역 기록
            const newEntity = new PaymentHistoryEntity();

            newEntity.amount = result.expectedAmount;
            newEntity.chargeAmount = result.expectedAmount;
            newEntity.merchantUid = ADMIN_MANUAL_OUTFLOW_UUID;
            newEntity.payMethod = ADMIN_MANUAL_OUTFLOW_METHOD;
            newEntity.pgProvider = ADMIN_MANUAL_OUTFLOW_PROVIDER;
            newEntity.currency = result.currency;
            newEntity.status = PAYMENT_HISTORY_STATUS.OUTFLOW;
            newEntity.user = user;

            await queryRunner.manager.insert(PaymentHistoryEntity, newEntity);

            isSendEmail = true;
            break;
          case OUTFLOW_HISTORY_STATUS.CANCELED:
            // 정산 취소 처리
            await queryRunner.manager.update(
              OutflowHistoryEntity,
              { id: outflowId },
              { status },
            );

            // 이용자 정산 신청 포인트 환불 처리 및 account history 기록
            const account =
              await this.accountService.getEntityByUserAndCurrency(
                user.id,
                result.currency,
                queryRunner,
              );
            await this.accountService.increaseBalance(
              account.id,
              Number(result.originAmount),
              result.currency,
              user.id,
              queryRunner,
            );
            await this.accountHistoryService.createDepositPointHistory(
              Number(result.originAmount),
              result.currency,
              account,
              queryRunner,
            );

            isSendEmail = true;

            break;
          default:
            isSuccessful = false;
            break;
        }
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
      isSuccessful = false;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return {
        isSuccessful,
        isSendEmail,
      };
    }
  }
}
