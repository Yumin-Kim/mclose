import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserEntity } from '../../entities/user.entity';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { DataSource, In, QueryRunner } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { AccountService } from '../account.service';
import { AccountHistoryService } from '../account-history.service';
import {
  ACCOUNT_CURRENCY,
  ACCOUNT_HISTORY_LEDGER_TYPE,
  ACCOUNT_HISTORY_STATUS,
  ACCOUNT_HISTORY_TYPE,
  MARKET_FEE_RATE,
  RESPONSE_CODE,
  STOCK_ACCOUNT_MAX_VOLUME,
  USAGE_HISTORY_TYPE,
} from '../../constant';
import { MarketItemService } from './market-item.service';
import { MarketHistoryService } from './market-history.service';
import { AccountActionService } from '../account-action.service';
import { MarketItemRepository } from '../../repositories/market-item.repository';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { MarketCartEntity } from '../../entities/market-cart.entity';
import { MarketCartRepository } from '../../repositories/market-cart.repository';
import { PagenationRes } from '../../common/response/response-page';
import { MarketLikeRepository } from '../../repositories/market-like.repository';
import { StockAccountService } from '../stock/stock-account.service';
import { UserService } from '../user.service';
import { MarketProfitPayoutHistoryEntity } from '../../entities/market-profit-payout-history.entity';
import { MarketHistoryEntity } from '../../entities/market-history.entity';
import { StockAccountEntity } from '../../entities/stock-account.entity';

@Injectable()
export class MarketActionService {
  private readonly logger = new Logger(MarketActionService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly accountHistoryService: AccountHistoryService,
    private readonly marketHistoryService: MarketHistoryService,
    private readonly stockAccountService: StockAccountService,
    private readonly marketItemRepository: MarketItemRepository,
    private readonly marketCartRepository: MarketCartRepository,
    private readonly marketLikeRepository: MarketLikeRepository,
  ) {}

  // K_TODO: 24.11.14
  // 수정 하였지만 실제 테스트 하지 않음
  // 수정 사항 : marketHistory 필드 추가 및 지분이 존재하는 경우 bulk insert로 수정
  // bulkInsert 간 sql injection 공격에 취약할 수 있음
  // 추가적인 검증 로직 제거
  async purchase(
    buyer: UserEntity,
    marketItem: MarketItemEntity,
    isStockExist: boolean = false,
  ) {
    const buyerUserId = buyer.id;
    const queryRunner = this.dataSource.createQueryRunner();
    let isPurchased = false;
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const marketPrice = Number(marketItem.price);
      const feeAmount = marketPrice * MARKET_FEE_RATE;
      const remainAmount = marketPrice - feeAmount;

      // marketHistory 추가
      // K_TODO: 24.11.14 반영전 누적 금액 및 누적 조회수 기록 필요
      const marketHistory = await this.marketHistoryService.create(
        buyer,
        marketItem,
        queryRunner,
        remainAmount,
        feeAmount,
        isStockExist,
      );
      // 사용자 계좌 조회
      const buyerAccount = await this.accountService.getEntityByUserAndCurrency(
        buyerUserId,
        ACCOUNT_CURRENCY.CL,
        queryRunner,
      );

      if (isStockExist) {
        // 지분 조회
        // 나눠가진 지분이 존재하는 경우 배당된 지분에 따라 판매 금액 분배
        const stockAccountList =
          await this.stockAccountService.getEntityListByMarketItem(
            marketItem,
            queryRunner,
          );

        const holderAccountList =
          await this.accountService.getEntityListByUserAndCurrency(
            stockAccountList.map((item) => item.user.id),
            ACCOUNT_CURRENCY.CL,
            queryRunner,
          );

        const bulkInsertIncreaseAccountPreparedData = [];
        const bulkInsertDecreaseAccountPreparedData = [];
        const bulkInsertDepositAccountHistoryPreparedData = [];
        const bulkInsertWithDrawAccountHistoryPreparedData = [];
        const bulkInsertMarketProfitPayoutHistoryPreparedData = [];

        for (const stockAccount of stockAccountList) {
          const { volume, user } = stockAccount;
          const stockHolder = user.id;
          const holdingVolume = Number(volume) / STOCK_ACCOUNT_MAX_VOLUME;
          const shareProfit = Number(remainAmount) * Number(holdingVolume);
          const notFeeShareProfit = Number(marketPrice) * Number(holdingVolume);

          const holderAccount = holderAccountList.find(
            (account) => account.user.id === stockHolder,
          );

          const bulkInsertInCreaseAccountData = {
            id: holderAccount.id,
            balance: shareProfit,
            currency: ACCOUNT_CURRENCY.CL,
            userId: stockHolder,
          };

          const bulkInsertDecreaseAccountData = {
            id: buyerAccount.id,
            balance: notFeeShareProfit,
            currency: ACCOUNT_CURRENCY.CL,
            userId: buyerUserId,
          };

          const bulkInsertDepositAccountHistoryData = {
            amount: shareProfit,
            currency: ACCOUNT_CURRENCY.CL,
            type: ACCOUNT_HISTORY_TYPE.POINT,
            ledgerType: ACCOUNT_HISTORY_LEDGER_TYPE.DEPOSIT,
            status: ACCOUNT_HISTORY_STATUS.CONFIRMED,
            userId: stockHolder,
            accountId: holderAccount.id,
          };

          const bulkInsertWithDrawAccountHistoryData = {
            amount: -notFeeShareProfit,
            currency: ACCOUNT_CURRENCY.CL,
            type: ACCOUNT_HISTORY_TYPE.POINT,
            ledgerType: ACCOUNT_HISTORY_LEDGER_TYPE.WITHDRAW,
            status: ACCOUNT_HISTORY_STATUS.CONFIRMED,
            userId: buyerUserId,
            accountId: buyerAccount.id,
          };

          const bulkInsertMarketProfitPayoutHistoryData = {
            spendAmount: -notFeeShareProfit,
            profitAmount: shareProfit,
            volume: holdingVolume * 100,
            buyerId: buyerUserId,
            stockholderId: stockHolder,
            marketHistoryId: marketHistory,
            stockAccountId: stockAccount.id,
          };

          bulkInsertIncreaseAccountPreparedData.push(
            bulkInsertInCreaseAccountData,
          );
          bulkInsertDecreaseAccountPreparedData.push(
            bulkInsertDecreaseAccountData,
          );
          bulkInsertDepositAccountHistoryPreparedData.push(
            bulkInsertDepositAccountHistoryData,
          );
          bulkInsertWithDrawAccountHistoryPreparedData.push(
            bulkInsertWithDrawAccountHistoryData,
          );
          bulkInsertMarketProfitPayoutHistoryPreparedData.push(
            bulkInsertMarketProfitPayoutHistoryData,
          );
        }

        // bulk insert
        await this.accountService.bulkIncreaseBalance(
          bulkInsertIncreaseAccountPreparedData,
          queryRunner,
        );

        await this.accountService.bulkDecreaseBalance(
          bulkInsertDecreaseAccountPreparedData,
          queryRunner,
        );

        await this.accountHistoryService.createBulkDepositPointHistory(
          bulkInsertDepositAccountHistoryPreparedData,
          queryRunner,
        );

        await this.accountHistoryService.createBulkWithdrawPointHistory(
          bulkInsertWithDrawAccountHistoryPreparedData,
          queryRunner,
        );

        await this.createBulkMarketProfitPayoutHistory(
          bulkInsertMarketProfitPayoutHistoryPreparedData,
          queryRunner,
        );
      } else {
        const sellerAccount =
          await this.accountService.getEntityByUserAndCurrency(
            marketItem.user.id,
            ACCOUNT_CURRENCY.CL,
            queryRunner,
          );

        // point 입출금
        await this.accountService.decreaseBalance(
          buyerAccount.id,
          marketPrice,
          ACCOUNT_CURRENCY.CL,
          buyerUserId,
          queryRunner,
        );
        await this.accountService.increaseBalance(
          sellerAccount.id,
          remainAmount,
          ACCOUNT_CURRENCY.CL,
          marketItem.user.id,
          queryRunner,
        );

        // point 입출금 history 추가
        await this.accountHistoryService.createDepositPointHistory(
          remainAmount,
          ACCOUNT_CURRENCY.CL,
          sellerAccount,
          queryRunner,
        );
        await this.accountHistoryService.createWithdrawPointHistory(
          -marketPrice,
          ACCOUNT_CURRENCY.CL,
          buyerAccount,
          queryRunner,
        );
      }

      // marketItem purchaseCnt 증가
      await this.increasePurchaseCnt(marketItem.id, queryRunner);

      // 사용 이력 추가
      await this.userService.createUsageHistory(
        USAGE_HISTORY_TYPE.MARKET,
        marketItem.id,
        buyerUserId,
        ACCOUNT_CURRENCY.CL,
        marketItem.price,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      isPurchased = true;
    } catch (e) {
      console.log(e);

      await queryRunner.rollbackTransaction();
      isPurchased = false;
      throw e;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return isPurchased;
    }
  }

  // market view count 감소
  async increasePurchaseCnt(id: number, queryRunner: QueryRunner) {
    return queryRunner.manager.increment(
      MarketItemEntity,
      { id },
      'purchaseCnt',
      1,
    );
  }

  // market view count 감소
  async decreasePurchaseCnt(id: number, queryRunner: QueryRunner) {
    return queryRunner.manager.decrement(
      MarketItemEntity,
      { id },
      'purchaseCnt',
      1,
    );
  }

  // market like count 증가
  async increaseLikeCnt(id: number) {
    return this.marketItemRepository.increment({ id }, 'likeCnt', 1);
  }

  // market like count 감소
  async decreaseLikeCnt(id: number) {
    return this.marketItemRepository.decrement({ id }, 'likeCnt', 1);
  }

  // market view count 증가
  async increaseViewCnt(id: number) {
    return this.marketItemRepository.increment({ id }, 'viewCnt', 1);
  }

  // market view count 감소
  async decreaseViewCnt(id: number) {
    return this.marketItemRepository.decrement({ id }, 'viewCnt', 1);
  }

  async isLike(marketItem: MarketItemEntity, user: UserEntity) {
    const result = await this.marketLikeRepository.findOne({
      where: {
        marketItem: {
          id: marketItem.id,
        },
        user: {
          id: user.id,
        },
      },
    });

    return result ? true : false;
  }

  async like(marketItem: MarketItemEntity, user: UserEntity) {
    const newEntity = new MarketCartEntity();
    newEntity.user = user;
    newEntity.marketItem = marketItem;

    await this.marketLikeRepository.save(newEntity);

    await this.increaseLikeCnt(marketItem.id);

    return true;
  }

  async unlike(marketItem: MarketItemEntity, user: UserEntity) {
    await this.marketLikeRepository.delete({
      user: user,
      marketItem: marketItem,
    });

    await this.decreaseLikeCnt(marketItem.id);

    return true;
  }

  async listMarketCart(page: number, pageSize: number, user: UserEntity) {
    let list = [];

    const [entityList, count] = await this.marketCartRepository.findAndCount({
      where: {
        user: user,
      },
      relations: ['marketItem'],
      // take: pageSize,
      // skip: page,
      order: {
        id: 'DESC',
      },
    });

    if (entityList.length > 0) {
      list = entityList.map((item) => {
        return {
          id: item.id,
          marketItemId: item.marketItem.id,
          title: item.marketItem.title,
          price: item.marketItem.price,
          thumbnailUrl: item.marketItem.thumbnailUrl,
          hashTag: item.marketItem.hashTag,
          likeCnt: item.marketItem.likeCnt,
          viewCnt: item.marketItem.viewCnt,
          purchaseCnt: item.marketItem.purchaseCnt,
        };
      });
    }

    return new PagenationRes(page / pageSize, pageSize, count, list);
  }

  async isMarketCart(marketItem: MarketItemEntity, user: UserEntity) {
    const marketCartItem = await this.marketCartRepository.findOne({
      where: {
        user: user,
        marketItem: marketItem,
      },
    });

    return marketCartItem ? true : false;
  }

  async createMarketCart(marketItem: MarketItemEntity, user: UserEntity) {
    const newEntity = new MarketCartEntity();
    newEntity.user = user;
    newEntity.marketItem = marketItem;

    return this.marketCartRepository.save(newEntity);
  }

  async deleteMarketCart(marketItem: MarketItemEntity, user: UserEntity) {
    return this.marketCartRepository.delete({
      user,
      marketItem,
    });
  }

  async bulkDeleteMarketCart(
    marketCardItemList: MarketCartEntity[],
    user: UserEntity,
  ) {
    return this.marketCartRepository.delete({
      user: user,
      id: In(marketCardItemList.map((item) => item.id)),
    });
  }

  async findMarketCartByIdList(idList: number[], user: UserEntity) {
    return this.marketCartRepository.find({
      relations: ['marketItem'],
      where: {
        user: user,
        id: In(idList),
      },
    });
  }

  async createMarketProfitPayoutHistory(
    spendAmount: number,
    profitAmount: number,
    volume: number,
    buyer: UserEntity,
    stockholder: UserEntity,
    marketHistory: MarketHistoryEntity,
    stockAccount: StockAccountEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new MarketProfitPayoutHistoryEntity();
    newEntity.spendAmount = spendAmount;
    newEntity.profitAmount = profitAmount;
    newEntity.volume = volume;
    newEntity.buyer = buyer;
    newEntity.stockholder = stockholder;
    newEntity.marketHistory = marketHistory;
    newEntity.stockAccount = stockAccount;

    return await queryRunner.manager.save(newEntity);
  }

  async createBulkMarketProfitPayoutHistory(
    histories: {
      spendAmount: number;
      profitAmount: number;
      volume: number;
      buyerId: number;
      stockholderId: number;
      marketHistoryId: number;
      stockAccountId: number;
    }[],
    queryRunner: QueryRunner,
  ) {
    // Step 1: 유효성 검증
    if (histories.length === 0) {
      throw new Error('No data provided for bulk insert');
    }

    // Step 2: Bulk Insert 쿼리 준비
    const insertValues = histories
      .map(() => `(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`)
      .join(',');

    const query = `
      INSERT INTO mc_market_profit_payout_history (
        spend_amount, 
        profit_amount, 
        volume, 
        buy_user_id, 
        stock_holder_user_id, 
        market_history_id, 
        stock_account_id, 
        created_at, 
        updated_at
      ) VALUES ${insertValues};
    `;

    // Step 3: Prepared Statement 파라미터 생성
    const parameters = histories.flatMap((history) => [
      history.spendAmount,
      history.profitAmount,
      history.volume,
      history.buyerId,
      history.stockholderId,
      history.marketHistoryId,
      history.stockAccountId,
    ]);

    // Step 4: SQL 실행
    await queryRunner.query(query, parameters);
  }

  // TODO: daemon job
  async isDownloadable(marketItem: MarketItemEntity, user: UserEntity) {}

  // TODO: daemon job
  async expireDownload(marketItemList: MarketItemEntity[]) {}
}
