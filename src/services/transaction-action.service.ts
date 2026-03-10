import { Injectable } from '@nestjs/common';
import { MarketHistoryRepository } from '../repositories/market-history.repository';
import { StockMatchRepository } from '../repositories/stock-match.repository';
import { UserEntity } from '../entities/user.entity';
import { PagenationRes } from '../common/response/response-page';
import { MarketItemRepository } from '../repositories/market-item.repository';
import { StockAccountService } from './stock/stock-account.service';
import { StockAccountRepository } from '../repositories/stock-account.repository';
import { StockMatchEntity } from '../entities/stock-match.entity';
import { StockOrderLiveRepository } from '../repositories/stock-order-live.repository';
import {
  OUTFLOW_HISTORY_STATUS,
  OUTFLOW_HISTORY_TYPE,
  PAYMENT_HISTORY_STATUS,
  STOCK_ORDER_STATUS,
  USAGE_HISTORY_TYPE,
} from '../constant';
import { Brackets, DataSource, In, MoreThan, Not } from 'typeorm';
import { AccountRepository } from '../repositories/account.repository';
import { PaymentHistoryRepository } from '../repositories/payment-history.repository';
import { UsageHistoryRepository } from '../repositories/usage-history.repository';
import { PromptHistoryEntity } from '../entities/prompt-history.entity';
import { MarketItemEntity } from '../entities/market-item.entity';
import { StockItemEntity } from '../entities/stock-item.entity';
import { OutflowHistoryEntityRepository } from '../repositories/outflow-history.repository';
import { OutFlowHistoryDto } from '../dto/profile.dto';
import { OutflowHistoryEntity } from '../entities/outflow-history.entity';
import { PromptHistoryRepository } from '../repositories/prompt-history.repository';
import { RawVideoRepository } from '../repositories/raw-video.repository';
import { CommonService } from './common.service';
import { MarketProfitPayoutHistoryEntity } from '../entities/market-profit-payout-history.entity';
import { MarketProfitPayoutHistoryRespository } from '../repositories/market-profit-payout-history.repository';
import { MarketHistoryEntity } from '../entities/market-history.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountHistoryService } from './account-history.service';

@Injectable()
export class TransactionActionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    private readonly marketHistoryRepository: MarketHistoryRepository,
    private readonly marketItemRepository: MarketItemRepository,
    private readonly stockMatchRepository: StockMatchRepository,
    private readonly stockAccountRepository: StockAccountRepository,
    private readonly stockOrderLiveRepository: StockOrderLiveRepository,
    private readonly accountRepository: AccountRepository,
    private readonly paymentHistoryRepository: PaymentHistoryRepository,
    private readonly usageHistoryRepository: UsageHistoryRepository,
    private readonly outflowHistoryEntityRepository: OutflowHistoryEntityRepository,
    private readonly rawVideoRepository: RawVideoRepository,
    private readonly marketProfitPayoutHistoryRespository: MarketProfitPayoutHistoryRespository,
    private readonly accountService: AccountService,
    private readonly accountHistoryService: AccountHistoryService,
  ) {}

  // 개요 - 생성된 프로제트 수
  async getRawVideoCount(user: UserEntity) {
    const totalRawVideoCount = await this.rawVideoRepository.count({
      where: { user: user, isDeleted: false },
    });

    return totalRawVideoCount;
  }

  // 개요 - 이달의 수익
  async getSummaryMonthlyChart(user: UserEntity) {
    // 이전달 계산
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoLastDate = this.commonService.convertDateFormat(
      new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth() + 1, 0),
    );
    const oneMonthAgoFirstDate = this.commonService.convertDateFormat(
      new Date(oneMonthAgo.getFullYear(), oneMonthAgo.getMonth(), 1),
    );

    // 이전달 수익 조회
    const oneMonthAgoMarketProfit = await this.getTotalMarketProfit(
      oneMonthAgoFirstDate,
      oneMonthAgoLastDate,
      user,
    );
    const oneMonthAgoStockProfit = await this.getTotalProfitPayoutHistory(
      oneMonthAgoFirstDate,
      oneMonthAgoLastDate,
      user,
    );
    const totalOneMonthAgoProfit =
      oneMonthAgoMarketProfit + oneMonthAgoStockProfit;

    // 이번달 계산
    const currentMonthLastDate = this.commonService.convertDateFormat(
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    );
    const currentMonthFirstDate = this.commonService.convertDateFormat(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );

    // 이번달 수익 조회
    const currentMonthMarketProfit = await this.getTotalMarketProfit(
      currentMonthFirstDate,
      currentMonthLastDate,
      user,
    );
    const currentMonthStockProfit = await this.getTotalProfitPayoutHistory(
      currentMonthFirstDate,
      currentMonthLastDate,
      user,
    );
    const totalCurrentMonthProfit =
      currentMonthMarketProfit + currentMonthStockProfit;

    // 지난달 대비 증감률
    let totalProfitPercentage: string | number;

    if (totalOneMonthAgoProfit === 0) {
      // 지난달 수익이 없으면 100% 증가로 설정하거나 메시지 반환
      totalProfitPercentage = totalCurrentMonthProfit > 0 ? 100 : 0; // 이번달도 수익이 없으면 0%
    } else {
      totalProfitPercentage = Math.round(
        ((totalCurrentMonthProfit - totalOneMonthAgoProfit) /
          totalOneMonthAgoProfit) *
          100,
      );
    }

    const marketProfitPercent = Math.round(
      (currentMonthMarketProfit / totalCurrentMonthProfit) * 100,
    );
    const stockProfitPercent = Math.round(
      (currentMonthStockProfit / totalCurrentMonthProfit) * 100,
    );

    return {
      marketProfitPercent,
      stockProfitPercent,
      currentMonthMarketProfit,
      currentMonthStockProfit,
      totalCurrentMonthProfit,
      totalProfitPercentage,
    };
  }

  // 개요 - 많이 판매된 상품
  async getTopPurchaseMarketItemList(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    // 판매량이 높은 상위 5개 상품 조회
    // MAX(cumulativePurchaseCnt) GROUP BY market_item_id
    const query = this.marketHistoryRepository
      .createQueryBuilder('marketHistory')
      .select([
        'marketHistory.marketItem.id as id',
        'marketItem.title as title',
        'MAX(marketHistory.cumulativePurchaseCnt) as cumulativePurchaseCnt',
        'marketItem.price as price',
      ])
      .leftJoin('marketHistory.marketItem', 'marketItem')
      .where('marketHistory.sellUser.id = :userId', { userId: user.id })
      .andWhere('marketHistory.cumulativePurchaseCnt > 0')
      .andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      })
      .groupBy('marketHistory.marketItem.id')
      .orderBy('cumulativePurchaseCnt', 'DESC')
      .limit(5);

    const entityList = await query.getRawMany();

    return entityList.map((entity) => {
      return {
        id: entity.id,
        title: entity.title,
        cumulativePurchaseCnt: entity.cumulativePurchaseCnt,
        price: entity.price,
      };
    });
  }
  // 수익/마켓 - 신규 판매 등록 건
  // market_item COUNT.. userID = userId AND dateFrom < createdAt <  dateTo
  async getNewMarketItemCount(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    const totalCount = await this.marketItemRepository
      .createQueryBuilder('marketItem')
      .where('marketItem.user.id = :userId', { userId: user.id })
      .andWhere('marketItem.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      })
      .getCount();

    return totalCount;
  }

  // 수익/마켓 - 판매 완료 건
  // market_history COUNT.. seller_user_id = userId AND dateFrom < createdAt <  dateTo
  async getCompleteMarketHistoryCount(
    dateFrom: string | null,
    dateTo: string | null,
    user: UserEntity,
  ) {
    const query = this.marketHistoryRepository
      .createQueryBuilder('marketHistory')
      .where('marketHistory.sellUser.id = :userId', { userId: user.id });

    if (dateFrom && dateTo) {
      query.andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      });
    }

    return query.getCount();
  }

  // 수익- 마켓 - (오로지 지분 등록 되지 않은 영상) 판매 수익
  async getTotalMarketProfit(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    const marketTotalProfitResult = await this.marketHistoryRepository
      .createQueryBuilder('marketHistory')
      .select('COALESCE(SUM(marketHistory.amount) , 0 )', 'total_market_profit')
      .where('marketHistory.sellUser.id = :userId', { userId: user.id })
      .andWhere('marketHistory.isRegisteredStock = :isRegisteredStock', {
        isRegisteredStock: false,
      })
      .andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      })
      .getRawOne();

    return Number(marketTotalProfitResult.total_market_profit);
  }

  // 수익 - 판매 발생 수익 차트 데이터
  async getMarketProfitChart(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
    isMonthly: boolean,
  ) {
    const startDate = this.commonService.startOfDay(dateFrom);
    const endDate = this.commonService.endOfDay(dateTo);

    if (Number(isMonthly)) {
      // endDate (월 말 날짜로 변경)
      // endDate.setMonth(endDate.getMonth() + 1);

      // 날짜별 그룹핑을 위한 날짜 배열 생성 - YYYY-MM 형식
      const dateRange = [];
      while (startDate <= endDate) {
        dateRange.push(
          startDate.toISOString().split('T')[0].slice(0, 7).replace(/-/g, '.'),
        ); // YYYY-MM 형식
        startDate.setMonth(startDate.getMonth() + 1);
      }
      const groupedByDate: { [key: string]: Number } = {};
      dateRange.forEach((date) => (groupedByDate[date] = 0));

      const entityList = await this.marketHistoryRepository
        .createQueryBuilder('marketHistory')
        .select(
          'COALESCE(SUM(marketHistory.amount) , 0 )',
          'total_market_profit',
        )
        .addSelect('DATE_FORMAT(marketHistory.createdAt, "%Y.%m")', 'date')
        .where('marketHistory.sellUser.id = :userId', { userId: user.id })
        .andWhere('marketHistory.isRegisteredStock = :isRegisteredStock', {
          isRegisteredStock: false,
        })
        .andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: this.commonService.startOfDay(dateFrom + '.01'),
          dateTo: this.commonService.startOfDay(
            this.commonService.convertDateFormat(endDate),
          ),
        })
        .groupBy('date')
        .getRawMany();

      entityList.forEach((entity) => {
        const date = entity.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0;
        }
        groupedByDate[date] = Number(entity.total_market_profit);
      });

      return groupedByDate;
    } else {
      // 날짜별 그룹핑을 위한 날짜 배열 생성
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      // 날짜별 그룹핑을 위한 날짜 배열 생성
      const dateRange = [];
      while (startDate <= endDate) {
        dateRange.push(
          startDate.toISOString().split('T')[0].replace(/-/g, '.'),
        ); // YYYY.MM.DD 형식
        startDate.setDate(startDate.getDate() + 1);
      }

      const groupedByDate: { [key: string]: Number } = {};
      dateRange.forEach((date) => (groupedByDate[date] = 0));

      // db 조회
      const entityList = await this.marketHistoryRepository
        .createQueryBuilder('marketHistory')
        .select(
          'COALESCE(SUM(marketHistory.amount) , 0 )',
          'total_market_profit',
        )
        .addSelect('DATE_FORMAT(marketHistory.createdAt, "%Y.%m.%d")', 'date')
        .where('marketHistory.sellUser.id = :userId', { userId: user.id })
        .andWhere('marketHistory.isRegisteredStock = :isRegisteredStock', {
          isRegisteredStock: false,
        })
        .andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: this.commonService.startOfDay(dateFrom),
          dateTo: this.commonService.endOfDay(dateTo),
        })
        .groupBy('date')
        .getRawMany();

      entityList.forEach((entity) => {
        const date = entity.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0;
        }
        groupedByDate[date] = Number(entity.total_market_profit);
      });

      return groupedByDate;
    }
  }

  // 구매 - 구매 내역 조회
  async purchaseMarketHistory(
    availableDownload: boolean | null,
    keyword: string | null,
    dateFrom: string | null,
    dateTo: string | null,
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    let list = [];
    const query = this.marketHistoryRepository
      .createQueryBuilder('marketHistory')
      .leftJoinAndSelect('marketHistory.marketItem', 'marketItem')
      .leftJoinAndSelect('marketItem.rawVideo', 'rawVideo')
      .where('marketHistory.buyUser.id = :buyUserId', { buyUserId: user.id });

    if (keyword) {
      query.andWhere('TRIM(marketItem.title) LIKE :keyword', {
        keyword: `%${keyword.replace(/\s/g, '')}%`,
      });
    }

    if (dateFrom && dateTo) {
      query.andWhere('marketHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      });
    }

    if (availableDownload !== null) {
      query.andWhere('marketHistory.isAvailableDownload = :availableDownload', {
        availableDownload: Boolean(availableDownload),
      });
    }

    const [entityList, totalCount] = await query
      .orderBy('marketHistory.createdAt', 'DESC')
      .skip(page)
      .take(limit)
      .getManyAndCount();

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          marketItemId: entity.marketItem.id,
          title: entity.marketItem.title,
          price: entity.price,
          thumbnailUrl: entity.marketItem.thumbnailUrl,
          isAvailableDownload: entity.isAvailableDownload,
          availableDownloadAt: entity.availableDownloadAt,
          createdAt: entity.createdAt,
          isDeleted: entity.marketItem.isDeleted,
          isShow: entity.marketItem.isShow,
          issueComment: entity.marketItem.issueComment,
          originVideoUrl: entity.isAvailableDownload
            ? entity.marketItem.rawVideo.originVideoUrl
            : null,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 판매 - 판매 영상 내역 조회 K_TODO: 24.11.14 / 24.11.17 / 24.11.19
  async getSalesMarketHistoryList(
    page: number,
    limit: number,
    keyword: string | null,
    dateFrom: string | null,
    dateTo: string | null,
    user: UserEntity,
  ) {
    let list = [];
    let whereStr = '';
    if (keyword) {
      whereStr += `AND marketItem.title LIKE '%${keyword}%' `;
    }

    const totalCountSql = `
     SELECT COUNT(*) AS totalCount 
       FROM (
                SELECT
                  DATE(marketHistory.created_at) AS createdAt
                FROM
                  mc_market_history marketHistory
                LEFT JOIN mc_market_item marketItem
                  ON marketItem.id = marketHistory.market_item_id
                WHERE
                  marketHistory.sell_user_id = ?
                  AND marketHistory.created_at BETWEEN ? AND ?
                  AND marketItem.is_deleted = FALSE
                  ${whereStr}
                GROUP BY
                  DATE(marketHistory.created_at)
                ORDER BY
                  DATE(marketHistory.created_at) DESC
              ) sub`;
    const totalCountResult = await this.dataSource.query(totalCountSql, [
      user.id,
      this.commonService.startOfDay(dateFrom),
      this.commonService.endOfDay(dateTo),
    ]);

    const totalCount = totalCountResult[0].totalCount
      ? Number(totalCountResult[0].totalCount)
      : 0;

    if (totalCount !== 0) {
      // 날짜 서브쿼리 작성
      const rawQuery = `
        SELECT * FROM (
          SELECT
            marketHistory.id AS id,
            marketItem.id AS marketItemId,
            DATE_FORMAT(marketHistory.created_at, "%Y.%m.%d") AS createdAt,
            marketHistory.cumulative_sales_amount AS cumulativeSalesAmount,
            marketHistory.cumulative_view_cnt AS cumulativeViewCnt,
            marketHistory.cumulative_purchase_cnt AS cumulativePurchaseCnt,
            marketItem.title AS title,
            marketItem.thumbnail_url AS thumbnailUrl,
            ROW_NUMBER() OVER (
              PARTITION BY DATE(marketHistory.created_at), marketItem.id
              ORDER BY marketHistory.cumulative_purchase_cnt DESC
            ) AS rowNumber
          FROM
            mc_market_history marketHistory
          LEFT JOIN mc_market_item marketItem
            ON marketItem.id = marketHistory.market_item_id
          LEFT JOIN mc_raw_video rawVideo
            ON rawVideo.id = marketItem.raw_video_id
          WHERE
            DATE(marketHistory.created_at) IN (
              SELECT * FROM (
                SELECT
                  DATE(marketHistory.created_at) AS createdAt
                FROM
                  mc_market_history marketHistory
                LEFT JOIN mc_market_item marketItem
                  ON marketItem.id = marketHistory.market_item_id
                WHERE
                  marketHistory.sell_user_id = ?
                  AND marketHistory.created_at BETWEEN ? AND ?
                  AND marketItem.is_deleted = FALSE
                  ${whereStr}
                GROUP BY
                  DATE(marketHistory.created_at)
                ORDER BY
                  DATE(marketHistory.created_at) DESC
                LIMIT ${page}, ${limit}
              ) sub
            )
            AND marketHistory.sell_user_id = ?
            AND marketHistory.created_at BETWEEN ? AND ?
            AND marketItem.is_deleted = FALSE
            ${whereStr}
        ) A
        WHERE A.rowNumber = 1
        ORDER BY A.createdAt DESC;
      `;
      const results = await this.dataSource.query(rawQuery, [
        user.id,
        this.commonService.startOfDay(dateFrom),
        this.commonService.endOfDay(dateTo),
        user.id,
        this.commonService.startOfDay(dateFrom),
        this.commonService.endOfDay(dateTo),
      ]);

      if (results.length !== 0) {
        // date grouping
        // result [{ date:"YYYY.MM.DD" , list:[] }]
        list = results.reduce((acc, cur) => {
          if (acc.length === 0) {
            acc.push({ date: cur.createdAt, list: [cur] });
            return acc;
          }

          const last = acc[acc.length - 1];
          if (last.date === cur.createdAt) {
            last.list.push(cur);
          } else {
            acc.push({ date: cur.createdAt, list: [cur] });
          }

          return acc;
        }, []);
      }
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 판매 - 내가 등록한 영상 조회
  async getRegisterMarketItemList(
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    let list = [];
    const [entityList, totalCount] =
      await this.marketItemRepository.findAndCount({
        where: { user: user },
        order: { createdAt: 'DESC' },
        relations: ['rawVideo'],
        take: limit,
        skip: page,
      });

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          rawVideoId: entity.rawVideo.id,
          title: entity.title,
          price: entity.price,
          thumbnailUrl: entity.thumbnailUrl,
          isDeleted: entity.isDeleted,
          isShow: entity.isShow,
          createdAt: entity.createdAt,
          issueComment: entity.issueComment,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }
  // 지분 - 신규 구매 지분 건
  async getNewBuyStockMatchCount(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    const totalCount = await this.stockMatchRepository
      .createQueryBuilder('stockMatch')
      .where('stockMatch.buyUser.id = :userId', { userId: user.id })
      .andWhere('stockMatch.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      })
      .getCount();

    return totalCount;
  }

  // 지분 - 미체결 지분 건
  async getOrderLiveStockCount(user: UserEntity) {
    const totalCount = await this.stockOrderLiveRepository
      .createQueryBuilder('stockOrderLive')
      .where('stockOrderLive.user.id = :userId', { userId: user.id })
      .andWhere('stockOrderLive.status = :status', {
        status: STOCK_ORDER_STATUS.WAIT,
      })
      .andWhere('stockOrderLive.volume > 0')
      .andWhere('stockOrderLive.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      .getCount();

    return totalCount;
  }

  // 지분 - 발생 수익
  async getTotalProfitPayoutHistory(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    const totalProfit = await this.marketProfitPayoutHistoryRespository
      .createQueryBuilder('marketProfitPayoutHistory')
      .leftJoin('marketProfitPayoutHistory.stockholder', 'stockholder')
      .select(
        'COALESCE(SUM(marketProfitPayoutHistory.profitAmount), 0)',
        'totalProfit',
      )
      .where('marketProfitPayoutHistory.stockholder.id = :userId', {
        userId: user.id,
      })
      .andWhere(
        'marketProfitPayoutHistory.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: this.commonService.startOfDay(dateFrom),
          dateTo: this.commonService.endOfDay(dateTo),
        },
      )
      .getRawOne();

    return Number(totalProfit.totalProfit);
  }

  // 지분 - 발생 수익 차트 데이터
  async getStockProfitChart(
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
    isMonthly: boolean,
  ) {
    if (Number(isMonthly)) {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      // endDate (월 말 날짜로 변경) ??
      // K_TODO: 24.11.20
      // endDate.setMonth(endDate.getMonth() + 1);

      // 날짜별 그룹핑을 위한 날짜 배열 생성 - YYYY-MM 형식
      const dateRange = [];
      while (startDate <= endDate) {
        dateRange.push(
          startDate.toISOString().split('T')[0].slice(0, 7).replace(/-/g, '.'),
        ); // YYYY-MM 형식
        startDate.setMonth(startDate.getMonth() + 1);
      }
      const groupedByDate: { [key: string]: Number } = {};
      dateRange.forEach((date) => (groupedByDate[date] = 0));

      const entityList = await this.marketProfitPayoutHistoryRespository
        .createQueryBuilder('marketProfitPayoutHistory')
        .leftJoin('marketProfitPayoutHistory.stockholder', 'stockholder')
        .select(
          'COALESCE(SUM(marketProfitPayoutHistory.profitAmount), 0)',
          'totalProfit',
        )
        .addSelect(
          'DATE_FORMAT(marketProfitPayoutHistory.createdAt, "%Y.%m")',
          'date',
        )
        .where('stockholder.id = :userId', { userId: user.id })
        .andWhere(
          'marketProfitPayoutHistory.createdAt BETWEEN :dateFrom AND :dateTo',
          {
            dateFrom: this.commonService.startOfDay(dateRange[0] + '.01'),
            dateTo: this.commonService.endOfDay(
              this.commonService.convertDateFormat(endDate),
            ),
          },
        )
        .groupBy('date')
        .getRawMany();

      entityList.forEach((entity) => {
        const date = entity.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0;
        }
        groupedByDate[date] = Number(entity.totalProfit);
      });

      return groupedByDate;
    } else {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);

      // 날짜별 그룹핑을 위한 날짜 배열 생성
      const dateRange = [];
      while (startDate <= endDate) {
        dateRange.push(
          startDate.toISOString().split('T')[0].replace(/-/g, '.'),
        ); // YYYY.MM.DD 형식
        startDate.setDate(startDate.getDate() + 1);
      }
      const groupedByDate: { [key: string]: Number } = {};

      dateRange.forEach((date) => (groupedByDate[date] = 0));

      // db 조회
      const entityList = await this.marketProfitPayoutHistoryRespository
        .createQueryBuilder('marketProfitPayoutHistory')
        .leftJoin('marketProfitPayoutHistory.stockholder', 'stockholder')
        .select(
          'COALESCE(SUM(marketProfitPayoutHistory.profitAmount), 0)',
          'totalProfit',
        )
        .addSelect(
          'DATE_FORMAT(marketProfitPayoutHistory.createdAt, "%Y.%m.%d")',
          'date',
        )
        .where('stockholder.id = :userId', { userId: user.id })
        .andWhere(
          'marketProfitPayoutHistory.createdAt BETWEEN :dateFrom AND :dateTo',
          {
            dateFrom: this.commonService.startOfDay(dateFrom),
            dateTo: this.commonService.endOfDay(dateTo),
          },
        )
        .groupBy('date')
        .getRawMany();

      entityList.forEach((entity) => {
        const date = entity.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = 0;
        }
        groupedByDate[date] = Number(entity.totalProfit);
      });

      return groupedByDate;
    }
  }

  // 지분 - 보유 지분
  async getStockAccountCount(user: UserEntity) {
    const totalCount = await this.stockAccountRepository
      .createQueryBuilder('stockAccount')
      .leftJoin('stockAccount.stockItem', 'stockItem')
      .where('stockAccount.user.id = :userId', { userId: user.id })
      .andWhere('stockAccount.volume > 0')
      .andWhere('stockItem.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();

    return totalCount;
  }

  // 구매 - 보유 지분 조회
  async getStockAccountList(
    page: number,
    limit: number,
    sortBy: string,
    user: UserEntity,
  ) {
    let list = [];
    const count = await this.stockAccountRepository
      .createQueryBuilder('stockAccount')
      .leftJoinAndSelect('stockAccount.stockItem', 'stockItem')
      .where('stockAccount.user.id = :userId', { userId: user.id })
      .andWhere('stockAccount.volume > 0')
      .andWhere('stockItem.isDeleted = :isDeleted', { isDeleted: false })
      .getCount();

    if (count > 0) {
      const query = this.stockAccountRepository
        .createQueryBuilder('stockAccount')
        .leftJoinAndSelect('stockAccount.stockItem', 'stockItem')
        .leftJoinAndSelect(
          'mc_market_profit_payout_history',
          'marketProfitPayoutHistory',
          'marketProfitPayoutHistory.stock_account_id = stockAccount.id',
        )
        .select([
          'stockAccount.id',
          'stockAccount.volume',
          'stockAccount.updatedAt',
          'stockItem.id',
          'stockItem.title',
          'stockItem.thumbnailUrl',
          'stockItem.openPrice',
          'stockItem.isDeleted',
          'stockItem.isShow',
          'stockItem.issueComment',
          'COALESCE(SUM(marketProfitPayoutHistory.profit_amount), 0) as totalAmount',
        ])
        .where('stockAccount.user.id = :userId', { userId: user.id })
        .andWhere('stockAccount.volume > 0')
        .andWhere('stockItem.isDeleted = :isDeleted', { isDeleted: false })
        .groupBy('stockAccount.id')
        .addGroupBy('stockItem.id');

      // Sorting based on the provided conditions
      if (sortBy === 'volume_asc') {
        query.orderBy('stockAccount.volume', 'ASC');
      } else if (sortBy === 'volume_desc') {
        query.orderBy('stockAccount.volume', 'DESC');
      } else if (sortBy === 'total_asc') {
        query.orderBy('totalAmount', 'ASC');
      } else if (sortBy === 'total_desc') {
        query.orderBy('totalAmount', 'DESC');
      } else {
        query.orderBy('stockAccount.updatedAt', 'DESC');
      }

      query.limit(limit).offset(page);

      const entryList = await query.getRawMany();

      list = entryList.map((entry) => {
        return {
          id: entry.stockAccount_id,
          volume: entry.stockAccount_volume,
          totalAmount: entry.totalAmount,
          stockItemId: entry.stockItem_id,
          title: entry.stockItem_title,
          thumbnailUrl: entry.stockItem_thumbnail_url,
          updatedAt: entry.stockAccount_updated_at,
          openPrice: entry.stockItem_open_price,
          issueComment: entry.stockItem_issue_comment,
          isShow: entry.stockItem_is_show,
          isDeleted: entry.stockItem_is_deleted,
          isStockOwner: entry.stockItem_user_id === user.id,
        };
      });
    }

    return new PagenationRes(page / limit, limit, count, list);
  }

  // 구매 - 미체결 내역 조회
  async getOrderLiveList(page: number, limit: number, user: UserEntity) {
    let list = [];
    const [entityList, totalCount] =
      await this.stockOrderLiveRepository.findAndCount({
        relations: ['stockItem'],
        where: {
          user: user,
          // stockItem: {
          //   user: Not(user.id),
          // },
          status: STOCK_ORDER_STATUS.WAIT,
          isDeleted: false,
          volume: MoreThan(0),
        },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: page,
      });

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          type: entity.type,
          stockItemId: entity.stockItem.id,
          title: entity.stockItem.title,
          thumbnailUrl: entity.stockItem.thumbnailUrl,
          volume: entity.volume,
          openPrice: entity.stockItem.openPrice,
          orderPrice: entity.amount,
          lowPrice: entity.stockItem.lowPrice,
          createdAt: entity.createdAt,
          isShow: entity.stockItem.isShow,
          issueComment: entity.stockItem.issueComment,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 내가 등록한 지분 내역 조회
  // 판매된 지분 수량 : 사용자가 등록한 지분에서 판매 완료된 총 지분 수량
  // match에서 SUM(volume)  sellUser = me AND status = COMPLETE and in [stockItem]
  // 지분 등록 수량 : 내가 올린 지분의 총 수량 -> order_live에서 volume > 0 AND status = WAIT AND user = me
  async getRegisterStockItemList(
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    let list = [];
    const [entityList, totalCount] =
      await this.stockAccountRepository.findAndCount({
        relations: ['stockItem', 'stockItem.rawVideo'],
        where: {
          user: user,
          stockItem: {
            user: user,
          },
        },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: page,
      });

    if (entityList.length > 0) {
      const matchedSumResult = await this.stockMatchRepository
        .createQueryBuilder('stockMatch')
        .leftJoinAndSelect('stockMatch.stockItem', 'stockItem')
        .select([
          'stockMatch.stockItem.id as id',
          'IFNULL(SUM(stockMatch.volume), 0) as totalVolume',
        ])
        .where('stockMatch.sellUser.id = :userId', { userId: user.id })
        .andWhere('stockMatch.stockItem.id IN  (:...stockItemIds)', {
          stockItemIds: entityList.map((entity) => entity.stockItem.id),
        })
        .groupBy('stockMatch.stockItem.id')
        .getRawMany();

      const currentOrderLivceSumResult = await this.stockOrderLiveRepository
        .createQueryBuilder('stockOrderLive')
        .leftJoinAndSelect('stockOrderLive.stockItem', 'stockItem')
        .select([
          'stockOrderLive.stockItem.id as id',
          'IFNULL(SUM(stockOrderLive.volume), 0) as totalVolume',
        ])
        .where('stockOrderLive.user.id = :userId', { userId: user.id })
        .andWhere('stockOrderLive.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('stockOrderLive.status = :status', {
          status: STOCK_ORDER_STATUS.WAIT,
        })
        .andWhere('stockOrderLive.stockItem.id IN  (:...stockItemIds)', {
          stockItemIds: entityList.map((entity) => entity.stockItem.id),
        })
        .groupBy('stockOrderLive.stockItem.id')
        .getRawMany();

      list = entityList.map((entity) => {
        return {
          id: entity.id,
          stockItemId: entity.stockItem.id,
          title: entity.stockItem.title,
          thumbnailUrl: entity.stockItem.thumbnailUrl,
          volume: entity.volume,
          openPrice: entity.stockItem.openPrice,
          lowPrice: entity.stockItem.lowPrice,
          createdAt: entity.createdAt,
          matchedVolume:
            matchedSumResult.find((result) => result.id === entity.stockItem.id)
              ?.totalVolume || 0,
          currentOrderLiveVolume:
            currentOrderLivceSumResult.find(
              (result) => result.id === entity.stockItem.id,
            )?.totalVolume || 0,
          rawVideoId: entity.stockItem.rawVideo.id,
          isShow: entity.stockItem.isShow,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 판매 - 판매 지분 내역 조회
  async getSellMatchHistory(
    page: number,
    limit: number,
    keyword: string | null,
    dateFrom: string,
    dateTo: string,
    user: UserEntity,
  ) {
    let list = [];
    let whereStr = '';
    if (keyword) {
      whereStr += `AND stockItem.title LIKE '%${keyword}%' `;
    }

    const totalCountSql = `
     SELECT COUNT(*) AS totalCount 
       FROM (
            SELECT
              DATE(stockMatch.created_at) AS createdAt
            FROM
              mc_stock_match stockMatch
            LEFT JOIN mc_stock_item stockItem ON stockItem.id = stockMatch.stock_item_id
            LEFT JOIN mc_raw_video rawVideo ON rawVideo.id = stockItem.raw_video_id
            WHERE
              stockMatch.sell_user_id = ?
              AND stockMatch.created_at BETWEEN ? AND ?
              AND stockItem.is_deleted = FALSE
              ${whereStr}
            GROUP BY
              DATE(stockMatch.created_at)
            ORDER BY
              DATE(stockMatch.created_at) DESC
          ) sub`;

    const totalCountResult = await this.dataSource.query(totalCountSql, [
      user.id,
      this.commonService.startOfDay(dateFrom),
      this.commonService.endOfDay(dateTo),
    ]);

    const totalCount = totalCountResult[0].totalCount
      ? Number(totalCountResult[0].totalCount)
      : 0;

    if (totalCount !== 0) {
      const query = await this.stockMatchRepository
        .createQueryBuilder('stockMatch')
        .leftJoinAndSelect('stockMatch.stockItem', 'stockItem')
        .addSelect('DATE_FORMAT(stockMatch.createdAt, "%Y.%m.%d")', 'date')
        .where('stockMatch.sellUser.id = :userId', { userId: user.id })
        .andWhere('stockMatch.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: this.commonService.startOfDay(dateFrom),
          dateTo: this.commonService.endOfDay(dateTo),
        })
        .andWhere(
          `DATE(stockMatch.createdAt) IN (
          SELECT * FROM (
            SELECT
              DATE(stockMatch.created_at) AS createdAt
            FROM
              mc_stock_match stockMatch
            LEFT JOIN mc_stock_item stockItem ON stockItem.id = stockMatch.stock_item_id
            WHERE
              stockMatch.sell_user_id = :userId
              AND stockMatch.created_at BETWEEN :dateFrom AND :dateTo
              AND stockItem.is_deleted = FALSE
              ${whereStr}
            GROUP BY
              DATE(stockMatch.created_at)
            ORDER BY
              DATE(stockMatch.created_at) DESC
            LIMIT ${page}, ${limit}
          ) sub
        )`,
          {
            userId: user.id,
            dateFrom: this.commonService.startOfDay(dateFrom),
            dateTo: this.commonService.endOfDay(dateTo),
          },
        )
        .andWhere('stockItem.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('stockMatch.createdAt', 'DESC');

      if (keyword) {
        query.andWhere('stockItem.title LIKE :keyword', {
          keyword: `%${keyword}%`,
        });
      }

      const entityList = await query.getRawMany();

      if (entityList.length > 0) {
        // date grouping
        // result [{ date:"YYYY.MM.DD" , list:[] }]

        list = entityList
          .map((item) => {
            return {
              id: item.stockMatch_id,
              stockItemId: item.stockItem_id,
              title: item.stockItem_title,
              originVolume: item.stockMatch_original_volume, // 주문 생성시 등록한 지분량
              matchedVolume: item.stockMatch_volume, // 판매된 지분량
              createdAt: item.stockMatch_createdAt,
              thumbnailUrl: item.stockItem_thumbnail_url,
              isDeleted: item.stockItem_is_deleted,
              isShow: item.stockItem_is_show,
              issueComment: item.stockItem_issue_comment,
              date: item.date,
              amount: item.stockMatch_amount,
            };
          })
          .reduce((acc, cur) => {
            if (acc.length === 0) {
              acc.push({ date: cur.date, list: [cur] });
              return acc;
            }

            const last = acc[acc.length - 1];
            if (last.date === cur.date) {
              last.list.push(cur);
            } else {
              acc.push({ date: cur.date, list: [cur] });
            }

            return acc;
          }, []);
      }
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 정산 , 재화 내역 조회 -  보유 재화 조회
  async getAccountList(user: UserEntity) {
    // 재화 조회
    const accountList = await this.accountRepository.find({
      where: { user: user },
    });

    return accountList;
  }

  // 재화 내역 조회 -  재화 구매 내역 조회
  async getPaymentHistory(
    dateFrom: string,
    dateTo: string,
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    // 구매 내역 조회
    let list = [];

    const query = await this.paymentHistoryRepository
      .createQueryBuilder('paymentHistory')
      .where('paymentHistory.user.id = :userId', { userId: user.id })
      .andWhere('paymentHistory.status = :status', {
        status: PAYMENT_HISTORY_STATUS.PAID,
      });

    if (dateFrom && dateTo) {
      query.andWhere('paymentHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      });
    }

    query.orderBy('paymentHistory.createdAt', 'DESC').limit(limit).offset(page);

    const [entityList, totalCount] = await query.getManyAndCount();

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          amount: entity.amount,
          chargeAmount: entity.chargeAmount,
          currency: entity.currency,
          createdAt: entity.createdAt,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  //  재화 내역 조회 - 재화 사용 내역 조회
  async getUsageHistory(
    dateFrom: string,
    dateTo: string,
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    let list = [];

    const totalQuery = this.usageHistoryRepository
      .createQueryBuilder('usageHistory')
      .where('usageHistory.user.id = :userId', { userId: user.id });

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
        'usageHistory.stockItem',
        StockItemEntity,
        'stockItem',
        'usageHistory.type = :usageTypeToStock AND usageHistory.refId = stockItem.id',
        { usageTypeToStock: USAGE_HISTORY_TYPE.STOCK_MATCH_BUY },
      )
      .leftJoinAndMapOne(
        'usageHistory.promptHistory',
        PromptHistoryEntity,
        'promptHistory',
        'usageHistory.type = :usageTypeToPrompt AND usageHistory.refId = promptHistory.id',
        { usageTypeToPrompt: USAGE_HISTORY_TYPE.PROMPT },
      )
      .where('usageHistory.user.id = :userId', { userId: user.id });

    if (dateFrom && dateTo) {
      query.andWhere('usageHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      });

      totalQuery.andWhere(
        'usageHistory.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: this.commonService.startOfDay(dateFrom),
          dateTo: this.commonService.endOfDay(dateTo),
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
        'COALESCE(marketItem.id, stockItem.id, promptHistory.id) as item_id',
        'COALESCE(marketItem.title, stockItem.title, NULL) as title',
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
          createdAt: entity.usageHistory_createdAt,
          itemId: entity.item_id,
          title: entity.title,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  // 정산 or 환불 신청
  async createOutflow(data: OutFlowHistoryDto, user: UserEntity) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let isSuccessful = true;

    try {
      const newEntity = new OutflowHistoryEntity();
      // 금액
      newEntity.currency = data.currency;
      newEntity.expectedAmount = data.expectedAmount;
      newEntity.originAmount = data.originAmount;
      newEntity.fee = data.fee;

      // 부가 정보
      newEntity.type =
        data.type == OUTFLOW_HISTORY_TYPE.REFUND
          ? OUTFLOW_HISTORY_TYPE.REFUND
          : OUTFLOW_HISTORY_TYPE.SETTLEMENT;
      newEntity.status = OUTFLOW_HISTORY_STATUS.PENDING;
      newEntity.user = user;

      // 은행 정보
      newEntity.regBankCode = data.regBankCode;
      newEntity.regBankName = data.regBankName;
      newEntity.regBankAccountNumber = data.regBankAccountNumber;

      await queryRunner.manager.save(newEntity);

      const account = await this.accountService.getEntityByUserAndCurrency(
        user.id,
        data.currency,
        queryRunner,
      );
      await this.accountService.decreaseBalance(
        account.id,
        Number(data.originAmount),
        data.currency,
        user.id,
        queryRunner,
      );

      // widrawal history 생성
      await this.accountHistoryService.createWithdrawPointHistory(
        -Number(data.originAmount),
        data.currency,
        account,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      isSuccessful = true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);

      isSuccessful = false;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return isSuccessful;
    }
  }

  // 정산 환불 내역 조회시 최근 신청 내역 조회
  async getOutflowPendingList(user: UserEntity) {
    return this.outflowHistoryEntityRepository.find({
      where: {
        user: user,
        status: In([
          OUTFLOW_HISTORY_STATUS.PENDING,
          OUTFLOW_HISTORY_STATUS.PROGRESS,
        ]),
      },
    });
  }

  // 정산 환불 내역 조회
  async getOutflowList(
    status: string,
    type: string | null,
    dateFrom: string | null,
    dateTo: string | null,
    page: number,
    limit: number,
    user: UserEntity,
  ) {
    let list = [];
    const query = this.outflowHistoryEntityRepository
      .createQueryBuilder('outflowHistory')
      .where('outflowHistory.user.id = :userId', { userId: user.id });

    if (status) {
      query.andWhere('outflowHistory.status = :status', { status: status });
    }

    if (type) {
      query.andWhere('outflowHistory.type = :type', { type: type });
    }

    if (dateFrom && dateTo) {
      query.andWhere('outflowHistory.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: this.commonService.startOfDay(dateFrom),
        dateTo: this.commonService.endOfDay(dateTo),
      });
    }

    const [entityList, totalCount] = await query
      .orderBy('outflowHistory.id', 'DESC')
      .skip(page)
      .take(limit)
      .getManyAndCount();

    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.id,
          type: entity.type,
          currency: entity.currency,
          expectedAmount: entity.expectedAmount,
          originAmount: entity.originAmount,
          status: entity.status,
          createdAt: entity.createdAt,
          processAt: entity.processAt,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }
}
