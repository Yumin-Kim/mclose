import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user.service';
import { StockItemService } from './stock-item.service';
import { StockOrderLiveEntity } from '../../entities/stock-order-live.entity';
import {
  ACCOUNT_CURRENCY,
  RESPONSE_CODE,
  STOCK_ACCOUNT_MAX_VOLUME,
  STOCK_ORDER_CANCEL_TYPE,
  STOCK_ORDER_STATUS,
  STOCK_ORDER_TYPE,
  USAGE_HISTORY_TYPE,
} from '../../constant';
import {
  DaemonDeleteStockItemDto,
  DaemonOrderDto,
  StockMatchDto,
  StockOrderCancelDto,
} from '../../dto/stock.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AccountActionService } from '../account-action.service';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { StockAccountEntity } from '../../entities/stock-account.entity';
import { StockActionService } from './stock-action.service';

@Injectable()
export class StockMatchService {
  private readonly logger = new Logger(StockMatchService.name);
  private readonly MCLOSE_STOCK_FEE;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly stockItemService: StockItemService,
    private readonly configService: ConfigService,
    private readonly accountActionService: AccountActionService,
    private readonly stockActionService: StockActionService,
  ) {
    this.MCLOSE_STOCK_FEE =
      this.configService.get<number>('MCLOSE_STOCK_FEE') || 0.01;
  }

  /**
   * Buy(구매 요청시 우측과 같은 타입을 지원해야한다.) -> matching:SELL , stockActionService.openOrder:BUY
   * Sell(판매 요청시 우측과 같은 타입을 제공해야한다.) -> matching:BUY , stockActionService.openOrder:SELL
   * @param daemonMatchDto id:stockItemId
   * @param matchingType SELL | BUY
   * @param openOrderType BUY | SELL
   * @param isModfyOrderFlag 주문 수정 함수를 통한 호출인 경우 true
   * @returns
   */
  async matchingOrder(
    daemonMatchDto: DaemonOrderDto,
    matchingType: string,
    openOrderType: string,
    isModfyOrderFlag: boolean = false,
  ) {
    const { userId, commandUUID } = daemonMatchDto;
    const matchHistory = [] as StockMatchDto[];
    const totalAmount = daemonMatchDto.amount * daemonMatchDto.volume;
    let tmpRemainOrderVolume = daemonMatchDto.volume;
    let isOpenOrder = false;
    let retCode = RESPONSE_CODE.SUCCESS;

    // create queryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // [START] order_live에 존재한 주문 조회
      // @desc 주문한 volume * amount 보다 큰 주문인 경우만 조회
      const cumulativeList = await this.stockActionService.cumulativeAmount(
        queryRunner,
        daemonMatchDto.amount,
        daemonMatchDto.volume,
        matchingType,
        daemonMatchDto.id,
      );
      // [END] 누적 주문 금액 조회

      // [START] 주문 처리 -----------------------------------------------
      // @desc 하나의 주문 내역이 (누적된 금액 = 일치 || 충분한 경우) 또는 존재 하지 앟는 경우
      // if 주문한 volume * amount 보다 작거나 같은 주문 조회
      if (cumulativeList.length === 0) {
        const isNotEmptyOrder = await this.stockActionService.getRemainOrder(
          queryRunner,
          daemonMatchDto.amount,
          matchingType,
          null,
          daemonMatchDto.id,
        );

        // 요청 주문에 대한 미체결 주문이 존재 하지 않는 경우
        if (!isNotEmptyOrder) {
          if (!isModfyOrderFlag) {
            // [START] 주문 생성 , orderBook 생성 ---------------------------------
            this.logger.debug(
              'There is no open order for the current order request.',
            );
            this.logger.log(
              `[matching-order] Open Order | commandUUID: ${commandUUID} | userId: ${userId} | openOrderType: ${openOrderType}`,
            );

            // 주문 생성
            await this.stockActionService.openOrder(
              queryRunner,
              daemonMatchDto.amount,
              tmpRemainOrderVolume,
              openOrderType,
              userId,
              daemonMatchDto.id,
            );

            // orderBook 생성
            await this.stockActionService.upsertOrderBook(
              queryRunner,
              daemonMatchDto.id,
              tmpRemainOrderVolume,
              daemonMatchDto.amount,
              openOrderType,
              true,
            );

            // 2024.12.14 - 주의 사항 : 주문 생성 후 구매자 계좌에서 금액 차감
            if (openOrderType === STOCK_ORDER_TYPE.BUY) {
              await this.stockActionService.openAfterAccount(
                queryRunner,
                daemonMatchDto.amount,
                tmpRemainOrderVolume,
                userId,
              );
            }
            // [END] 주문 생성 , orderBook 생성 -----------------------------------

            isOpenOrder = true;
          }
        } else {
          this.logger.debug("There's an open order for the current order.");
          this.logger.log(
            `[matching-order] Matching Order | commandUUID: ${commandUUID} | userId: ${userId} | matchingType: ${matchingType} | openOrderType: ${openOrderType}`,
          );

          const { id, amount, volume, user, originVolume } = isNotEmptyOrder;
          const matchHistoryItem = {
            amount: amount,
            type: daemonMatchDto.type,
            buyUserId:
              openOrderType === STOCK_ORDER_TYPE.BUY ? userId : user.id,
            sellUserId:
              openOrderType === STOCK_ORDER_TYPE.SELL ? userId : user.id,
            orderLiveId: id,
            stockItemId: daemonMatchDto.id,
          } as StockMatchDto;

          // 사용자 주문 총 금액 < 주문 금액 * 주문 수량
          if (totalAmount < amount * volume) {
            const feeAmount = totalAmount * this.MCLOSE_STOCK_FEE;
            const deductedAmount = totalAmount - feeAmount;
            const originalAmount = totalAmount;

            await this.stockActionService.updateOrderLive(
              queryRunner,
              id,
              tmpRemainOrderVolume,
              false,
            );
            await this.stockActionService.matchAfterAccount(
              queryRunner,
              deductedAmount,
              originalAmount,
              matchHistoryItem.buyUserId,
              matchHistoryItem.sellUserId,
            );

            matchHistoryItem['feeAmount'] = feeAmount;
            matchHistoryItem['totalAmount'] = deductedAmount;
            matchHistoryItem['volume'] = tmpRemainOrderVolume;
            matchHistoryItem['originalVolume'] = originVolume;

            matchHistory.push(matchHistoryItem);

            tmpRemainOrderVolume = 0;
          } else if (totalAmount == amount * volume) {
            // 사용자 주문 총 금액 == 주문 금액 * 주문 수량
            const feeAmount = amount * volume * this.MCLOSE_STOCK_FEE;
            const deductedAmount = amount * volume - feeAmount;
            const originalAmount = amount * volume;

            await this.stockActionService.updateOrderLive(
              queryRunner,
              id,
              volume,
              true,
            );
            await this.stockActionService.matchAfterAccount(
              queryRunner,
              deductedAmount,
              originalAmount,
              matchHistoryItem.buyUserId,
              matchHistoryItem.sellUserId,
            );

            matchHistoryItem['feeAmount'] = feeAmount;
            matchHistoryItem['totalAmount'] = deductedAmount;
            matchHistoryItem['volume'] = volume;
            matchHistoryItem['originalVolume'] = originVolume;

            matchHistory.push(matchHistoryItem);

            tmpRemainOrderVolume = 0;
          } else {
            //   주문이 존재 하지 않는 경우
            if (!isModfyOrderFlag) {
              // [START] 주문 생성 , orderBook 생성 ---------------------------------
              this.logger.log(`[${openOrderType}] Open Order`);

              // 주문 생성
              await this.stockActionService.openOrder(
                queryRunner,
                daemonMatchDto.amount,
                tmpRemainOrderVolume,
                openOrderType,
                userId,
                daemonMatchDto.id,
              );

              // orderBook 생성
              await this.stockActionService.upsertOrderBook(
                queryRunner,
                daemonMatchDto.id,
                tmpRemainOrderVolume,
                daemonMatchDto.amount,
                openOrderType,
                true,
              );

              // 2024.12.14 - 주의 사항 : 주문 생성 후 구매자 계좌에서 금액 차감
              if (openOrderType === STOCK_ORDER_TYPE.BUY) {
                await this.stockActionService.openAfterAccount(
                  queryRunner,
                  daemonMatchDto.amount,
                  tmpRemainOrderVolume,
                  userId,
                );
              }
              // [END] 주문 생성 , orderBook 생성 ---------------------------------
              isOpenOrder = true;
            }
          }
        }
      } else {
        // else 사용자 총 주문 금액을 처리 하기 위한 조회
        // 조회 이후 남은 주문이 있는 경우 & 총 주문 금액이 남은 주문의 총 금액보다 큰 경우
        if (
          cumulativeList[cumulativeList.length - 1].cumulative_amount <
          totalAmount
        ) {
          this.logger.log(
            `[matching-order] Matching multi order | commandUUID: ${commandUUID} | userId: ${userId} | openOrderType: ${openOrderType}`,
          );
          const remainIdList = cumulativeList.map((order) => Number(order.id));
          const remainOrder = await this.stockActionService.getRemainOrder(
            queryRunner,
            daemonMatchDto.amount,
            matchingType,
            remainIdList,
            daemonMatchDto.id,
            // userId,
          );

          if (remainOrder) {
            // 총 주문 금액 <= 남은 주문의 총 금액
            const {
              id,
              amount,
              volume,
              user: orderedUser,
              type,
              originVolume,
            } = remainOrder;
            cumulativeList.push({
              id,
              amount,
              volume,
              user_id: orderedUser.id,
              type,
              cumulative_amount:
                cumulativeList[cumulativeList.length - 1] + amount * volume,
              origin_volume: originVolume,
            });
          } else {
            // 추가 주문 생성 또는 주문 완료만 처리
          }

          // 주문 체결 및 account 업데이트
          // [START] 사용자 주문 처리 -----------------------------------------
          for (const cumulative of cumulativeList) {
            const {
              id,
              amount,
              volume,
              user_id: orderedUserId,
              origin_volume,
            } = cumulative;
            const matchHistoryItem = {
              amount,
              type: daemonMatchDto.type,
              buyUserId:
                openOrderType === STOCK_ORDER_TYPE.BUY ? userId : orderedUserId,
              sellUserId:
                openOrderType === STOCK_ORDER_TYPE.SELL
                  ? userId
                  : orderedUserId,
              orderLiveId: id,
              stockItemId: daemonMatchDto.id,
            } as StockMatchDto;

            // 사용자 요청 주문 > 조회된 타 사용자 주문
            if (tmpRemainOrderVolume > volume) {
              const feeAmount = amount * volume * this.MCLOSE_STOCK_FEE;
              const deductedAmount = amount * volume - feeAmount;
              const originalAmount = amount * volume;

              await this.stockActionService.updateOrderLive(
                queryRunner,
                id,
                volume,
                true,
              );
              await this.stockActionService.matchAfterAccount(
                queryRunner,
                deductedAmount,
                originalAmount,
                matchHistoryItem.buyUserId,
                matchHistoryItem.sellUserId,
              );

              matchHistoryItem['volume'] = volume;
              matchHistoryItem['originalVolume'] = origin_volume;
              matchHistoryItem['feeAmount'] = feeAmount;
              matchHistoryItem['totalAmount'] = deductedAmount;

              matchHistory.push(matchHistoryItem);

              tmpRemainOrderVolume -= volume;
            } else if (tmpRemainOrderVolume < volume) {
              // 사용자 요청 주문 < 조회된 타 사용자 주문
              const feeAmount =
                amount * tmpRemainOrderVolume * this.MCLOSE_STOCK_FEE;
              const deductedAmount = amount * tmpRemainOrderVolume - feeAmount;
              const originalAmount = amount * tmpRemainOrderVolume;

              await this.stockActionService.updateOrderLive(
                queryRunner,
                id,
                tmpRemainOrderVolume,
                false,
              );
              await this.stockActionService.matchAfterAccount(
                queryRunner,
                deductedAmount,
                originalAmount,
                matchHistoryItem.buyUserId,
                matchHistoryItem.sellUserId,
              );

              matchHistoryItem['volume'] = tmpRemainOrderVolume;
              matchHistoryItem['originalVolume'] = origin_volume;
              matchHistoryItem['feeAmount'] = feeAmount;
              matchHistoryItem['totalAmount'] = deductedAmount;

              matchHistory.push(matchHistoryItem);

              tmpRemainOrderVolume = 0;
            } else if (tmpRemainOrderVolume == volume) {
              const feeAmount = amount * volume * this.MCLOSE_STOCK_FEE;
              const deductedAmount = amount * volume - feeAmount;
              const originalAmount = amount * volume;
              await this.stockActionService.updateOrderLive(
                queryRunner,
                id,
                volume,
                true,
              );
              await this.stockActionService.matchAfterAccount(
                queryRunner,
                deductedAmount,
                originalAmount,
                matchHistoryItem.buyUserId,
                matchHistoryItem.sellUserId,
              );

              matchHistoryItem['volume'] = volume;
              matchHistoryItem['originalVolume'] = origin_volume;
              matchHistoryItem['feeAmount'] = feeAmount;
              matchHistoryItem['totalAmount'] = deductedAmount;

              matchHistory.push(matchHistoryItem);

              tmpRemainOrderVolume = 0;
            } else if (tmpRemainOrderVolume == 0) {
              break;
            }
          }
        } else {
          this.logger.error(
            `[matching-order] totalAmount > cumulative_amount | commandUUID: ${commandUUID} | userId: ${userId} | totalAmount: ${totalAmount}`,
          );

          retCode = RESPONSE_CODE.STOCK_MATCHING_ERROR;
          throw new Error('totalAmount > cumulative_amount');
        }
      }

      // 주문 내역 생성 & 지분 반영
      if (matchHistory.length > 0) {
        for (const match of matchHistory) {
          // 주문 내역 생성
          await this.stockActionService.createMatchHistory(queryRunner, match);

          // 지분 반영
          await this.stockActionService.matchAfterStockAccount(
            queryRunner,
            match.volume,
            match.buyUserId,
            match.sellUserId,
            daemonMatchDto.id,
            daemonMatchDto.marketItemId,
          );

          await this.userService.createUsageHistory(
            USAGE_HISTORY_TYPE.STOCK_MATCH_BUY,
            daemonMatchDto.id,
            match.buyUserId,
            ACCOUNT_CURRENCY.OS,
            match.volume * match.amount,
            queryRunner,
          );
        }

        // stockItem matchCnt 증가
        await this.stockItemService.increaseMatchCnt(
          daemonMatchDto.id,
          matchHistory.length,
          queryRunner,
        );

        // orderBook 갱신
        await this.stockActionService.upsertOrderBook(
          queryRunner,
          daemonMatchDto.id,
          daemonMatchDto.volume - tmpRemainOrderVolume,
          daemonMatchDto.amount,
          matchingType,
          false,
        );
      }

      // 잔여 주문이 존재 하는 경우
      if (tmpRemainOrderVolume > 0 && !isOpenOrder) {
        if (!isModfyOrderFlag) {
          // [START] 주문 생성 , orderBook 생성 ---------------------------------
          this.logger.log(
            `[matching-order] Remain Order | commandUUID: ${commandUUID} | userId: ${userId} |  openOrderType: ${openOrderType}`,
          );

          await this.stockActionService.openOrder(
            queryRunner,
            daemonMatchDto.amount,
            tmpRemainOrderVolume,
            openOrderType,
            userId,
            daemonMatchDto.id,
          );
          await this.stockActionService.upsertOrderBook(
            queryRunner,
            daemonMatchDto.id,
            tmpRemainOrderVolume,
            daemonMatchDto.amount,
            openOrderType,
            true,
          );

          // 2024.12.14 - 주의 사항 : 주문 생성 후 구매자 계좌에서 금액 차감
          if (openOrderType === STOCK_ORDER_TYPE.BUY) {
            await this.stockActionService.openAfterAccount(
              queryRunner,
              daemonMatchDto.amount,
              tmpRemainOrderVolume,
              userId,
            );
          }
          // [END] 주문 생성 , orderBook 생성 -----------------------------------
        }
      }

      // 주문 생성 완료 및 체결 완료
      if (!isModfyOrderFlag) {
        this.logger.log(
          `[matching-order] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | openOrderType: ${openOrderType} | matchingType: ${matchingType} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount} | totalAmount: ${totalAmount}`,
        );
      } else {
        this.logger.log(
          `[matching-order] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | openOrderType: ${openOrderType} | matchingType: ${matchingType} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount} | totalAmount: ${totalAmount} | isModfyOrderFlag: ${isModfyOrderFlag}`,
        );
      }

      // 주문 완료 후 주문 내역 업데이트
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);

      this.logger.error(
        `[matching-order] ERROR | commandUUID: ${commandUUID} | userId: ${userId} | openOrderType: ${openOrderType} | matchingType: ${matchingType} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount}`,
      );
      retCode = RESPONSE_CODE.STOCK_MATCHING_ERROR;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
        this.logger.log(`[matching-order] queryRunner released`);
      }

      return {
        ...daemonMatchDto,
        openOrderVolume: tmpRemainOrderVolume,
        matchingOrderVolume: daemonMatchDto.volume - tmpRemainOrderVolume,
        matchingCnt: matchHistory.length,
        retCode,
        matchHistory,
      };
    }
  }

  // 주문 취소
  async cancelOrder(daemonMatchDto: DaemonOrderDto) {
    const { userId, commandUUID } = daemonMatchDto;
    let retCode = RESPONSE_CODE.SUCCESS;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderLiveResult = await this.stockActionService.getOrderLiveById(
        queryRunner,
        daemonMatchDto.id,
      );
      if (!orderLiveResult || orderLiveResult.user.id != userId) {
        this.logger.error(
          `[cancel-order] User not found commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_NOT_FOUND;
        throw new Error('Order not found');
      }
      if (
        orderLiveResult.isDeleted ||
        orderLiveResult.status !== STOCK_ORDER_STATUS.WAIT
      ) {
        this.logger.error(
          `[cancel-order] Order is not available commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_NOT_AVAILABLE;
        throw new Error('Order is not available');
      }

      // 미체결 주문 삭제
      await queryRunner.manager.update(
        StockOrderLiveEntity,
        { id: daemonMatchDto.id },
        {
          isDeleted: true,
          status: STOCK_ORDER_STATUS.CANCELED,
          deletedAt: () => 'CURRENT_TIMESTAMP',
        },
      );

      // orderBook 수정
      await this.stockActionService.upsertOrderBook(
        queryRunner,
        orderLiveResult.stockItem.id,
        orderLiveResult.volume,
        orderLiveResult.amount,
        orderLiveResult.type,
        false,
      );

      // 주문 취소로 인한 계좌 잔액 복구
      if (orderLiveResult.type === STOCK_ORDER_TYPE.BUY) {
        await this.accountActionService.depositToPoint(
          queryRunner,
          Number(orderLiveResult.amount) * Number(orderLiveResult.volume),
          ACCOUNT_CURRENCY.OS,
          userId,
        );
      }

      // 2025.03.24 - 주문 취소시 주문 취소 내역을 기록해야함
      // orderLive 삭제 후 orderCancel 기록
      const stockOrderCancelDto = {
        volume: orderLiveResult.volume,
        amount: orderLiveResult.amount,
        regType:
          orderLiveResult.type === STOCK_ORDER_TYPE.BUY
            ? STOCK_ORDER_CANCEL_TYPE.BUYER_CANCEL
            : STOCK_ORDER_CANCEL_TYPE.SELLER_CANCEL,
        user: orderLiveResult.user,
        stockItem: orderLiveResult.stockItem,
        stockOrderLive: orderLiveResult,
      } as StockOrderCancelDto;

      const isCancelOrder =
        await this.stockActionService.createCancelOrderHistory(queryRunner, [
          stockOrderCancelDto,
        ]);
      if (!isCancelOrder) {
        this.logger.error(
          `[cancel-order] Order cancel history not created commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_CANCEL_NOT_CREATED;
        throw new Error('Order cancel history not created');
      }

      this.logger.log(
        `[cancel-order] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | volume: ${orderLiveResult.volume} | amount: ${orderLiveResult.amount}`,
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
      this.logger.error(
        `[cancel-order] ERROR | commandUUID: ${commandUUID} | userId: ${userId} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount}`,
      );
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
        this.logger.log('[CANCELD] queryRunner released');
      }
    }

    return {
      ...daemonMatchDto,
      retCode,
    };
  }

  /**
   * 주문 수정
   * 수정시 수량만 , 금약만 , 수량&금액 변경 가능
   * 주문 수정 후 주문 체결 로직을 호출한다.(단 주문 생성은 하지 않는다.)
   * @param daemonMatchDto id:orderLiveId
   * @param orderType : BUY | SELL (modify-buy->BUY, modify-sell->SELL)
   * @returns
   */
  async modifyOrder(daemonMatchDto: DaemonOrderDto, orderType) {
    const { userId, commandUUID } = daemonMatchDto;
    let retCode = RESPONSE_CODE.SUCCESS;
    let isOpenOrder = false;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderLiveResult = await this.stockActionService.getOrderLiveById(
        queryRunner,
        daemonMatchDto.orderLiveId,
      );
      // 미체결 주문 정보 검증
      if (
        !orderLiveResult ||
        orderLiveResult.user.id != userId ||
        orderLiveResult.type !== orderType
      ) {
        this.logger.error(
          `[modify-${orderType}] Order not found commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_NOT_FOUND;
        throw new Error('Order not found');
      }
      if (
        orderLiveResult.isDeleted ||
        orderLiveResult.status !== STOCK_ORDER_STATUS.WAIT
      ) {
        this.logger.error(
          `[modify-${orderType}] Order is not available commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_NOT_AVAILABLE;
        throw new Error('Order is not available');
      }

      // 변경된 주문 정보와 기존 주문 정보 비교
      const { amount, volume } = orderLiveResult;
      const diffAmount = Number(daemonMatchDto.amount) - Number(amount);
      const diffVolume = Number(volume) - Number(daemonMatchDto.volume);

      // 주문 금액, 수량이 변경되지 않은 경우
      if (diffAmount === 0 && diffVolume === 0) {
        this.logger.error(
          `[modify-${orderType}] No change commandUUID : ${commandUUID} | userId : ${userId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ORDER_NO_CHANGE;
        throw new Error('No change');
      }

      // 주문 변경으로 인한 계좌 잔액 변경
      if (
        orderType === STOCK_ORDER_TYPE.BUY &&
        orderLiveResult.type === STOCK_ORDER_TYPE.BUY
      ) {
        // 주문 수정전 금액 복구
        await this.accountActionService.depositToPoint(
          queryRunner,
          Number(orderLiveResult.amount) * Number(orderLiveResult.volume),
          ACCOUNT_CURRENCY.OS,
          userId,
        );

        // 주문 수정후 금액 차감
        await this.accountActionService.widthdrawFromPoint(
          queryRunner,
          Number(daemonMatchDto.amount) * Number(daemonMatchDto.volume),
          ACCOUNT_CURRENCY.OS,
          userId,
        );
      }

      // [START] orderbook 수정 -----------------------------------------------
      // 기존 orderBook 삭제
      await this.stockActionService.upsertOrderBook(
        queryRunner,
        orderLiveResult.stockItem.id,
        volume,
        amount,
        orderType,
        false,
      );

      // 수정된 orderBook 생성
      await this.stockActionService.upsertOrderBook(
        queryRunner,
        orderLiveResult.stockItem.id,
        daemonMatchDto.volume,
        daemonMatchDto.amount,
        orderType,
        true,
      );
      // [END] orderbook 수정 -----------------------------------------------

      // 주문 금액이 변경된 경우
      if (diffAmount != 0 && diffVolume === 0) {
        // 주문 금액이 변경된 경우
        await queryRunner.manager.update(
          StockOrderLiveEntity,
          { id: daemonMatchDto.orderLiveId },
          { amount: daemonMatchDto.amount },
        );
        // 2024.12.01 - mathinOrder 함수 호출을 통한 주문 체결 및 생성
        isOpenOrder = true;
      } else if (diffAmount === 0 && diffVolume != 0) {
        // 주문 수량이 변경된 경우
        // K_TODO: 24.11.20 volume, originVolume 동일하게 수정
        await queryRunner.manager.update(
          StockOrderLiveEntity,
          { id: daemonMatchDto.orderLiveId },
          {
            volume: daemonMatchDto.volume,
            originVolume: daemonMatchDto.volume,
          },
        );
      } else {
        // 주문 금액, 수량이 변경된 경우
        // K_TODO: 24.11.20 volume, originVolume 동일하게 수정
        await queryRunner.manager.update(
          StockOrderLiveEntity,
          { id: daemonMatchDto.orderLiveId },
          {
            amount: daemonMatchDto.amount,
            volume: daemonMatchDto.volume,
            originVolume: daemonMatchDto.volume,
          },
        );
        // 2024.12.01 - mathinOrder 함수 호출을 통한 주문 체결 및 생성
        isOpenOrder = true;
      }

      this.logger.log(
        `[modify-${orderType}] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount}`,
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      console.log(e);
      this.logger.error(
        `[modify-${orderType}] ERROR | commandUUID: ${commandUUID} | userId: ${userId} | volume: ${daemonMatchDto.volume} | amount: ${daemonMatchDto.amount}`,
      );
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
        this.logger.log(`[modify-${orderType}] queryRunner released`);
      }
    }

    return {
      ...daemonMatchDto,
      retCode,
      isOpenOrder,
    };
  }

  async delete(daemonMatchDto: DaemonDeleteStockItemDto) {
    const { userId, commandUUID, id, stockAccountId } = daemonMatchDto;
    let retCode = RESPONSE_CODE.SUCCESS;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 지분 배분 정보 조회
      const stockAccountResult = await queryRunner.manager.findOne(
        StockAccountEntity,
        {
          where: { id: stockAccountId, user: { id: userId } },
        },
      );
      if (!stockAccountResult) {
        this.logger.error(
          `[delete-stock] StockAccount not found commandUUID : ${commandUUID} | userId : ${userId} | stockAccountId : ${stockAccountId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND;
        throw new Error('[delete-stock] StockAccount not found');
      }
      if (stockAccountResult.volume != STOCK_ACCOUNT_MAX_VOLUME) {
        this.logger.error(
          `[delete-stock] StockAccount volume is not empty commandUUID : ${commandUUID} | userId : ${userId} | stockAccountId : ${stockAccountId}`,
        );
        retCode = RESPONSE_CODE.STOCK_ACCOUNT_NOT_MAX_VOLUME;
        throw new Error('[delete-stock] StockAccount volume is not max volume');
      }

      // 지분 정보 삭제
      const isDeletedStock = await queryRunner.manager.update(
        StockItemEntity,
        { id, user: { id: userId } },
        {
          isDeleted: true,
          deletedAt: () => 'CURRENT_TIMESTAMP',
          isShow: false,
        },
      );
      if (!isDeletedStock.affected) {
        this.logger.error(
          `[delete-stock] StockItem not found commandUUID : ${commandUUID} | userId : ${userId} | stockItemId : ${id}`,
        );
        retCode = RESPONSE_CODE.STOCK_ITEM_NOT_FOUND;
        throw new Error('[delete-stock] StockItem not found');
      }

      // 미체결 주문 삭제
      const orderLiveResult = await queryRunner.manager.find(
        StockOrderLiveEntity,
        {
          relations: ['stockItem', 'user'],
          where: {
            stockItem: { id },
            isDeleted: false,
            status: STOCK_ORDER_STATUS.WAIT,
          },
        },
      );

      // 미체결 주문이 존재 하는 경우
      if (orderLiveResult.length > 0) {
        // 구매 주문이 존재 하는 경우
        const buyOrderLiveResult = orderLiveResult.filter((order) => {
          if (order.type === STOCK_ORDER_TYPE.BUY) {
            return order;
          }
        });

        // 구매 주문이 존재 하는 경우 구매 주문 금액 복구
        if (buyOrderLiveResult.length > 0) {
          for (const order of buyOrderLiveResult) {
            await this.accountActionService.depositToPoint(
              queryRunner,
              Number(order.amount) * Number(order.volume),
              ACCOUNT_CURRENCY.OS,
              userId,
            );
          }
        }

        // 미체결 주문 삭제
        await queryRunner.manager.update(
          StockOrderLiveEntity,
          { stockItem: { id } },
          {
            isDeleted: true,
            status: STOCK_ORDER_STATUS.CANCELED,
            deletedAt: () => 'CURRENT_TIMESTAMP',
          },
        );

        // 2025.03.24 - 주문 취소시 주문 취소 내역을 기록해야함
        // orderLive 삭제 후 orderCancel 기록
        const orderCancelList: StockOrderCancelDto[] = orderLiveResult.map(
          (orderLive, i) => {
            return {
              volume: orderLive.volume,
              amount: orderLive.amount,
              regType: STOCK_ORDER_CANCEL_TYPE.SELLER_DELETE,
              user: orderLive.user,
              stockItem: orderLive.stockItem,
              stockOrderLive: orderLiveResult[i],
            };
          },
        );

        const isCreatedCancelOrder =
          await this.stockActionService.createCancelOrderHistory(
            queryRunner,
            orderCancelList,
          );
        if (!isCreatedCancelOrder) {
          this.logger.error(
            `[delete-stock] OrderCancel not created commandUUID : ${commandUUID} | userId : ${userId} | stockItemId : ${id}`,
          );
          retCode = RESPONSE_CODE.STOCK_ORDER_CANCEL_NOT_CREATED;
          throw new Error('[delete-stock] OrderCancel not created');
        }
      }
      await queryRunner.commitTransaction();
      this.logger.log(
        `[delete-stock] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | stockItemId: ${id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      this.logger.error(
        `[delete-stock] ERROR | commandUUID: ${commandUUID} | userId: ${userId} | stockItemId: ${id}`,
      );
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
        this.logger.log(`[delete-stock] queryRunner released`);
      }
    }

    return {
      ...daemonMatchDto,
      retCode,
    };
  }

  async hideItem(daemonMatchDto: DaemonDeleteStockItemDto) {
    const { userId, commandUUID, id } = daemonMatchDto;
    let retCode = RESPONSE_CODE.SUCCESS;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 지분 정보 show false
      const isDeletedStock = await queryRunner.manager.update(
        StockItemEntity,
        { id, user: { id: userId } },
        {
          isShow: false,
        },
      );
      if (!isDeletedStock.affected) {
        this.logger.error(
          `[hide-stock] StockItem not found commandUUID : ${commandUUID} | userId : ${userId} | stockItemId : ${id}`,
        );
        retCode = RESPONSE_CODE.STOCK_ITEM_NOT_FOUND;
        throw new Error('[hide-stock] StockItem not found');
      }

      // 미체결 주문 삭제
      const orderLiveResult = await queryRunner.manager.find(
        StockOrderLiveEntity,
        {
          relations: ['stockItem', 'user'],
          where: {
            stockItem: { id },
            isDeleted: false,
            status: STOCK_ORDER_STATUS.WAIT,
          },
        },
      );

      // 미체결 주문이 존재 하는 경우
      if (orderLiveResult.length > 0) {
        // 구매 주문이 존재 하는 경우
        const buyOrderLiveResult = orderLiveResult.filter((order) => {
          if (order.type === STOCK_ORDER_TYPE.BUY) {
            return order;
          }
        });

        // 구매 주문이 존재 하는 경우 구매 주문 금액 복구
        if (buyOrderLiveResult.length > 0) {
          for (const order of buyOrderLiveResult) {
            await this.accountActionService.depositToPoint(
              queryRunner,
              Number(order.amount) * Number(order.volume),
              ACCOUNT_CURRENCY.OS,
              userId,
            );
          }
        }

        // 미체결 주문 삭제
        await queryRunner.manager.update(
          StockOrderLiveEntity,
          { stockItem: { id } },
          {
            isDeleted: true,
            status: STOCK_ORDER_STATUS.HIDE,
            deletedAt: () => 'CURRENT_TIMESTAMP',
          },
        );

        // orderbook 삭제
        await this.stockActionService.deleteOrderBook(queryRunner, id);

        // 2025.03.24 - 주문 취소시 주문 취소 내역을 기록해야함
        // orderLive 삭제 후 orderCancel 기록
        const orderCancelList: StockOrderCancelDto[] = orderLiveResult.map(
          (orderLive, i) => {
            return {
              volume: orderLive.volume,
              amount: orderLive.amount,
              regType: STOCK_ORDER_CANCEL_TYPE.ADMIN_DELETE,
              user: orderLive.user,
              stockItem: orderLive.stockItem,
              stockOrderLive: orderLiveResult[i],
            };
          },
        );

        const isCreatedCancelOrder =
          await this.stockActionService.createCancelOrderHistory(
            queryRunner,
            orderCancelList,
          );
        if (!isCreatedCancelOrder) {
          this.logger.error(
            `[hide-stock] OrderCancel not created commandUUID : ${commandUUID} | userId : ${userId} | stockItemId : ${id}`,
          );
          retCode = RESPONSE_CODE.STOCK_ORDER_CANCEL_NOT_CREATED;
          throw new Error('[hide-stock] OrderCancel not created');
        }
      }
      await queryRunner.commitTransaction();
      this.logger.log(
        `[hide-stock] SUCCESS | commandUUID: ${commandUUID} | userId: ${userId} | stockItemId: ${id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log(error);
      this.logger.error(
        `[hide-stock] ERROR | commandUUID: ${commandUUID} | userId: ${userId} | stockItemId: ${id}`,
      );
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
        this.logger.log(`[hide-stock] queryRunner released`);
      }
    }

    return {
      ...daemonMatchDto,
      retCode,
    };
  }
}
