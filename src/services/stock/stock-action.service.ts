import { Injectable, Logger } from '@nestjs/common';
import { StockAccountService } from './stock-account.service';
import { StockItemService } from './stock-item.service';
import { StockOrderLiveRepository } from '../../repositories/stock-order-live.repository';
import { StockOrderRepository } from '../../repositories/stock-order.repository';
import { StockOrderLiveEntity } from '../../entities/stock-order-live.entity';
import {
  ACCOUNT_CURRENCY,
  FASTBOOK_MODE,
  STOCK_ACCOUNT_MAX_REMAIN_VOLUME,
  STOCK_ORDER_STATUS,
  STOCK_ORDER_TYPE,
} from '../../constant';
import { StockOrderEntity } from '../../entities/stock-order.entity';
import {
  StockGateawayEventMatchDto,
  StockMatchDto,
  StockOrderCancelDto,
} from '../../dto/stock.dto';
import { UserEntity } from '../../entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { In, Not, QueryRunner } from 'typeorm';
import { AccountActionService } from '../account-action.service';
import { StockMatchEntity } from '../../entities/stock-match.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { StockOrderCancelEntity } from '../../entities/stock-order-cancel.entity';

@Injectable()
export class StockActionService {
  private readonly logger = new Logger(StockActionService.name);

  constructor(
    private readonly stockAccountService: StockAccountService,
    private readonly stockItemService: StockItemService,
    private readonly stockOrderLiveRepository: StockOrderLiveRepository,
    private readonly stockOrderRepository: StockOrderRepository,
    private readonly accountActionService: AccountActionService,
  ) {}

  // 최초 지분 생성시 호출
  async initOrder(
    volume: number,
    amount: number,
    user: UserEntity,
    stockItem: StockItemEntity,
  ) {
    // stockOrderLive 생성
    // K_TODO: 24.11.20 originVolume 추가
    const newOrderLiveEntity = new StockOrderLiveEntity();
    newOrderLiveEntity.volume = volume;
    newOrderLiveEntity.originVolume = volume;
    newOrderLiveEntity.amount = amount;
    newOrderLiveEntity.type = STOCK_ORDER_TYPE.SELL;
    newOrderLiveEntity.status = STOCK_ORDER_STATUS.WAIT;
    newOrderLiveEntity.user = user;
    newOrderLiveEntity.stockItem = stockItem;

    await this.stockOrderLiveRepository.save(newOrderLiveEntity);

    // stockOrder 생성
    const newOrderEntity = new StockOrderEntity();
    newOrderEntity.volume = volume;
    newOrderEntity.amount = amount;
    newOrderEntity.type = STOCK_ORDER_TYPE.SELL;
    newOrderEntity.stockItem = stockItem;

    await this.stockOrderRepository.save(newOrderEntity);

    return true;
  }

  // 주문 생성
  async openOrder(
    queryRunner: QueryRunner,
    amount: number,
    volume: number,
    type: string,
    userId: number,
    stockItemId: number,
  ) {
    // K_TODO: 24.11.20 originVolume 추가
    return await queryRunner.manager.insert(StockOrderLiveEntity, {
      amount: amount,
      volume: volume,
      originVolume: volume,
      type: type,
      status: STOCK_ORDER_STATUS.WAIT,
      user: { id: userId },
      stockItem: { id: stockItemId },
    });
  }

  // K_TODO: 24.11.10 AND user_id != ? 제거
  async cumulativeAmount(
    queryRunner: QueryRunner,
    amount: number,
    volume: number,
    type: string,
    stockItemId: number,
  ) {
    // return await this.stockOrderLiveRepository
    //   .createQueryBuilder('orderLive', queryRunner)
    //   .addSelect(
    //     '@running_total := @running_total + (amount * volume) AS cumulative_amount',
    //   )
    //   .leftJoinAndSelect('orderLive.stockItem', 'stockItem')
    //   .leftJoinAndSelect('orderLive.user', 'user')
    //   .where('orderLive.amount = :amount', { amount })
    //   .andWhere('orderLive.is_deleted = 0')
    //   .andWhere('stock_item_id = :stockItemId', { stockItemId })
    //   // .andWhere('stock_item_id = :stockItemId', { stockItemId })
    //   .andWhere('type = :type', { type })
    //   .andWhere('orderLive.user_id != :userId', { userId })
    //   .orderBy('orderLive.id', 'ASC')
    //   .getRawMany();

    return await queryRunner.manager.query(
      `WITH live_ordered AS (
        SELECT
          id, amount, volume,
          type, status, is_deleted, stock_item_id, user_id, origin_volume,
          @running_total := @running_total + (amount * volume) AS cumulative_amount
        FROM mc_stock_order_live , (SELECT @running_total := 0) r
        WHERE
          amount = ?
          AND is_deleted = 0
          AND stock_item_id = ?
          AND type = ?
        ORDER BY id ASC
      )
      SELECT *
      FROM live_ordered
      WHERE cumulative_amount < ?;`,
      [amount, stockItemId, type, volume * amount],
    );
  }

  // K_TODO: 24.11.10 AND user_id != ? 제거
  async getRemainOrder(
    queryRunner: QueryRunner,
    amount: number,
    type: string,
    remainIdList: null | number[] = null,
    stockItemId: number,
    // userId: number,
  ) {
    const where = {
      amount,
      type,
      stockItem: {
        id: stockItemId,
      },
      // user: {
      //   id: Not(userId),
      // },
      isDeleted: false,
      status: STOCK_ORDER_STATUS.WAIT,
    };

    if (remainIdList) {
      where['id'] = Not(In(remainIdList));
    }

    return queryRunner.manager.findOne(StockOrderLiveEntity, {
      relations: ['stockItem', 'user'],
      where,
      order: {
        id: 'ASC',
      },
    });
    // let where = '';
    // const replacements = [amount, type, userId, stockItemId] as any[];

    // if (remainIdList) {
    //   where = `AND id NOT IN (?)`;
    //   replacements.push(remainIdList);
    // }

    // return await queryRunner.manager.query(
    //   `SELECT *
    //   FROM mc_stock_order_live
    //   WHERE
    //     amount = ?
    //     AND type = ?
    //     AND is_deleted = 0
    //     AND status = 'WAIT'
    //     AND user_id != ?
    //     AND stock_item_id = ?
    //     ${where}
    //   ORDER BY id ASC
    //   LIMIT 1;
    //     `,
    //   replacements,
    // );
  }

  async updateOrderLive(
    queryRunner: QueryRunner,
    orderLiveId: number,
    volume: number,
    isDeleted: boolean,
  ) {
    const updateObj = {
      volume: () => `volume - ${volume}`,
    };
    if (isDeleted) {
      updateObj['isDeleted'] = true;
      updateObj['status'] = STOCK_ORDER_STATUS.COMPLETE;
      updateObj['deletedAt'] = () => 'CURRENT_TIMESTAMP';
    }
    return queryRunner.manager.update(
      StockOrderLiveEntity,
      { id: orderLiveId },
      updateObj,
    );
  }

  async matchAfterAccount(
    queryRunner: QueryRunner,
    deductedAmount: number, // 차감 금액
    originalAmount: number, // 원금
    buyerUserId: number,
    sellerUserId: number,
  ) {
    const isDeposit = await this.accountActionService.depositToPoint(
      queryRunner,
      deductedAmount,
      ACCOUNT_CURRENCY.OS,
      sellerUserId,
    );
    if (!isDeposit) {
      this.logger.error('Failed to deposit');
      throw new Error('Failed to deposit');
    }

    // const isWithdrawal = await this.accountActionService.widthdrawFromPoint(
    //   queryRunner,
    //   originalAmount,
    //   ACCOUNT_CURRENCY.OS,
    //   buyerUserId,
    // );
    // if (!isWithdrawal) {
    //   this.logger.error('Failed to withdrawal');
    //   throw new Error('Failed to withdrawal');
    // }
  }

  async openAfterAccount(
    queryRunner: QueryRunner,
    amount: number,
    volume: number,
    userId: number,
  ) {
    const deductedAmount = Number(amount) * Number(volume);
    const isWithdrawal = await this.accountActionService.widthdrawFromPoint(
      queryRunner,
      deductedAmount,
      ACCOUNT_CURRENCY.OS,
      userId,
    );
    if (!isWithdrawal) {
      this.logger.error('Failed to withdrawal');
      throw new Error('Failed to withdrawal');
    }
  }

  async matchAfterStockAccount(
    queryRunner: QueryRunner,
    volume: number,
    fromUserId: number,
    toUserId: number,
    stockItemId: number,
    marketItemId: number,
  ) {
    const isIncrease = await this.stockAccountService.increaseVolume(
      queryRunner,
      volume,
      fromUserId,
      stockItemId,
      marketItemId,
    );
    if (!isIncrease) {
      this.logger.error('Failed to increase volume');
      throw new Error('Failed to increase volume');
    }

    const isDecrease = await this.stockAccountService.decreaseVolume(
      queryRunner,
      volume,
      toUserId,
      stockItemId,
      marketItemId,
    );
    if (!isDecrease) {
      this.logger.error('Failed to decrease volume');
      throw new Error('Failed to decrease volume');
    }

    return true;
  }

  // 체결 내역 기록
  async createMatchHistory(
    queryRunner: QueryRunner,
    matchHistory: StockMatchDto,
  ) {
    return queryRunner.manager.insert(StockMatchEntity, {
      amount: matchHistory.amount,
      volume: matchHistory.volume,
      feeAmount: matchHistory.feeAmount,
      totalAmount: matchHistory.totalAmount,
      buyUser: { id: matchHistory.buyUserId },
      sellUser: { id: matchHistory.sellUserId },
      originalVolume: matchHistory.originalVolume,
      // type: matchHistory.type,
      // buyOrderLive: { id: matchHistory.buyOrderLiveId },
      // sellOrderLive: { id: matchHistory.sellOrderLiveId },
      stockItem: { id: matchHistory.stockItemId },
      orderLive: { id: matchHistory.orderLiveId },
    });
  }

  // 주문 취소
  async createCancelOrderHistory(
    queryRunner: QueryRunner,
    orderLiveResult: Array<StockOrderCancelDto>,
  ) {
    const bulkInsertLoopCnt = 1000;
    let insertResult = null;
    if (orderLiveResult.length === 0) {
      this.logger.error('Failed to insert cancel order history');
      return false;
    }

    if (orderLiveResult.length > bulkInsertLoopCnt) {
      for (let i = 0; i < orderLiveResult.length; i += bulkInsertLoopCnt) {
        const bulkInsert = orderLiveResult.slice(i, i + bulkInsertLoopCnt);
        insertResult = await queryRunner.manager.insert(
          StockOrderCancelEntity,
          bulkInsert,
        );
      }
    } else {
      insertResult = await queryRunner.manager.insert(
        StockOrderCancelEntity,
        orderLiveResult,
      );
    }

    const isSuccessful =
      insertResult &&
      orderLiveResult.length === insertResult.identifiers.length;
    if (!isSuccessful) {
      this.logger.error('Failed to insert cancel order history');
      return false;
    }

    return true;
  }

  async upsertOrderBook(
    queryRunner: QueryRunner,
    stockItemId: number,
    volume: number,
    amount: number,
    type: string,
    isOpenOrder: boolean = false,
  ) {
    const isExist = await queryRunner.manager.findOne(StockOrderEntity, {
      where: {
        stockItem: { id: stockItemId },
        amount,
        type,
      },
    });

    if (isExist) {
      if (isOpenOrder) {
        return queryRunner.manager.update(
          StockOrderEntity,
          {
            stockItem: { id: stockItemId },
            amount,
            type,
          },
          {
            volume: () => `ABS(volume + ${volume})`,
          },
        );
      } else {
        return queryRunner.manager.update(
          StockOrderEntity,
          {
            stockItem: { id: stockItemId },
            amount,
            type,
          },
          {
            volume: () => `ABS(volume - ${volume})`,
          },
        );
      }
    } else {
      return queryRunner.manager.insert(StockOrderEntity, {
        stockItem: { id: stockItemId },
        amount,
        volume,
        type,
      });
    }
  }

  // 특정 수량의 주문 삭제
  async deleteOrderBookItem(
    queryRunner: QueryRunner,
    stockItemId: number,
    amount: number,
    type: string,
  ) {
    return queryRunner.manager.delete(StockOrderEntity, {
      stockItem: { id: stockItemId },
      amount,
      type,
    });
  }

  // 주문 창 삭제
  async deleteOrderBook(queryRunner: QueryRunner, stockItemId: number) {
    return queryRunner.manager.delete(StockOrderEntity, {
      stockItem: { id: stockItemId },
    });
  }

  // 특정 주문 조회
  async getOrderLiveById(queryRunner: QueryRunner | null = null, id: number) {
    if (!queryRunner) {
      return this.stockOrderLiveRepository.findOne({
        relations: ['stockItem', 'user'],
        where: {
          id,
        },
      });
    } else {
      return queryRunner.manager.findOne(StockOrderLiveEntity, {
        relations: ['stockItem', 'user'],
        where: {
          id,
        },
      });
    }
  }

  // orderbook 조회
  async getOrderBook(
    stockItemId: number,
    orderType: string,
    sort: 'ASC' | 'DESC',
  ) {
    return this.stockOrderRepository.find({
      where: {
        stockItem: { id: stockItemId },
        type: orderType,
        volume: Not(0),
      },
      order: {
        amount: sort,
      },
    });
  }

  // K_TODO: orderBook 조회간 제대로 조회 되는지 검증 필요
  async getOrderBookByAmount(
    stockItemId: number,
    orderType: string,
    amount: number,
  ) {
    return this.stockOrderRepository.findOne({
      where: {
        stockItem: { id: stockItemId },
        type: orderType,
        amount,
      },
    });
  }

  async getOrderLiveList(
    stockItem: StockItemEntity,
    orderType: string,
    sort: 'ASC' | 'DESC',
    isNotOwner: boolean = false,
  ) {
    if (isNotOwner) {
      return this.stockOrderLiveRepository.find({
        where: {
          stockItem: { id: stockItem.id },
          type: orderType,
          status: STOCK_ORDER_STATUS.WAIT,
          isDeleted: false,
          volume: Not(0),
          user: {
            id: Not(stockItem.user.id),
          },
        },
        order: {
          amount: sort,
        },
      });
    } else {
      return this.stockOrderLiveRepository.find({
        where: {
          stockItem: { id: stockItem.id },
          type: orderType,
          status: STOCK_ORDER_STATUS.WAIT,
          isDeleted: false,
          volume: Not(0),
        },
        order: {
          amount: sort,
        },
      });
    }
  }

  async sumOrderLiveVolume(
    stockItem: StockItemEntity,
    orderType: string,
    user: UserEntity,
  ) {
    const result = await this.stockOrderLiveRepository
      .createQueryBuilder('orderLive')
      .leftJoin('orderLive.stockItem', 'stockItem')
      .leftJoin('orderLive.user', 'user')
      .select('COALESCE(SUM(volume), 0)', 'sum')
      .where('orderLive.stockItem.id = :stockItemId', {
        stockItemId: stockItem.id,
      })
      .andWhere('orderLive.type = :orderType', { orderType })
      .andWhere('orderLive.user.id = :userId', { userId: user.id })
      .andWhere('orderLive.status = :status', {
        status: STOCK_ORDER_STATUS.WAIT,
      })
      .andWhere('orderLive.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne();

    return result.sum;
  }

  /**
   * websocket event-fastbook에 대한 데이터를 조회하기 위한 함수
   * @param matchingCnt
   * @param openOrderVolume
   * @param stockItemId
   * @param amount
   * @param matchingType
   * @param reqType
   * @param mode
   * @param originAmount
   * @returns
   */

  async getFastbookOrderList(
    matchingCnt,
    openOrderVolume,
    stockItemId,
    amount,
    matchingType: string | null,
    reqType = STOCK_ORDER_TYPE.BUY,
    mode = FASTBOOK_MODE.CREATE,
    originAmount: number | null = null,
  ) {
    const fastBook = [];

    switch (mode) {
      case FASTBOOK_MODE.CREATE:
        if (openOrderVolume > 0) {
          const newOrderBook = await this.getOrderBookByAmount(
            stockItemId,
            reqType,
            Number(amount),
          );

          if (newOrderBook) {
            fastBook.push(newOrderBook);
          }
        }

        if (matchingCnt > 0) {
          const matchingOrderBook = await this.getOrderBookByAmount(
            stockItemId,
            matchingType,
            Number(amount),
          );

          if (matchingOrderBook) {
            fastBook.push(matchingOrderBook);
          }
        }
        break;
      case FASTBOOK_MODE.MODIFY:
        const modifyFastBook = await this.getOrderBookByAmount(
          stockItemId,
          reqType,
          Number(amount),
        );

        if (modifyFastBook) {
          fastBook.push(modifyFastBook);
        }

        // 금액 , 금액/수량 수정시 아래 로직 동작
        if (originAmount) {
          const originFastBook = await this.getOrderBookByAmount(
            stockItemId,
            reqType,
            Number(originAmount),
          );

          if (originFastBook) {
            fastBook.push(originFastBook);
          }
        }

        break;
      case FASTBOOK_MODE.CANCEL:
        const cancelFastBook = await this.getOrderBookByAmount(
          stockItemId,
          reqType,
          Number(amount),
        );

        if (cancelFastBook) {
          fastBook.push(cancelFastBook);
        }
        break;
      default:
        break;
    }

    return fastBook;
  }

  // faskbook조회 이후 gateway로 전송
  async getMatchingAfterRemainVolume(stockItemId: number) {
    let remainingVolume = 0;
    const stockItem = await this.stockItemService.getEntityById(stockItemId);
    if (!stockItem) {
      return null;
    }

    const stockAccount =
      await this.stockAccountService.getEntityByUserAndStockItem(
        stockItem.user,
        stockItem,
        null,
      );
    if (!stockAccount) {
      return null;
    }
    remainingVolume =
      Number(stockAccount.volume) - STOCK_ACCOUNT_MAX_REMAIN_VOLUME;
    return remainingVolume;
  }

  filteringMathcingOrder(
    matchingHistory: StockMatchDto[],
  ): StockGateawayEventMatchDto[] {
    return matchingHistory.reduce(
      (acc, cur) => {
        // 1. `buyUserId` 기준 합산
        if (cur.buyUserId) {
          const buyIndex = acc.findIndex(
            (item) =>
              item.userId === cur.buyUserId &&
              item.type === STOCK_ORDER_TYPE.BUY,
          );
          if (buyIndex > -1) {
            acc[buyIndex].volume += cur.volume || 0;
          } else {
            acc.push({
              userId: cur.buyUserId,
              volume: cur.volume || 0,
              type: STOCK_ORDER_TYPE.BUY,
            });
          }
        }

        // 2. `sellUserId` 기준 합산
        if (cur.sellUserId) {
          const sellIndex = acc.findIndex(
            (item) =>
              item.userId === cur.sellUserId &&
              item.type === STOCK_ORDER_TYPE.SELL,
          );
          if (sellIndex > -1) {
            acc[sellIndex].volume += cur.volume || 0;
          } else {
            acc.push({
              userId: cur.sellUserId,
              volume: cur.volume || 0,
              type: STOCK_ORDER_TYPE.SELL,
            });
          }
        }

        return acc;
      },
      [] as {
        userId: number;
        volume: number;
        type: string;
      }[],
    );
  }
}
