import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { StockAccountRepository } from '../../repositories/stock-account.repository';
import { UserEntity } from '../../entities/user.entity';
import { QueryRunner } from 'typeorm';
import { StockAccountEntity } from '../../entities/stock-account.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { RESPONSE_CODE } from '../../constant';
import { MarketItemEntity } from '../../entities/market-item.entity';

@Injectable()
export class StockAccountService {
  private readonly logger = new Logger(StockAccountService.name);

  constructor(
    private readonly stockAccountRepository: StockAccountRepository,
  ) {}

  async create(
    user: UserEntity,
    marketItem: MarketItemEntity,
    stockItem: StockItemEntity,
  ) {
    const newEntity = new StockAccountEntity();
    newEntity.volume = 100;
    newEntity.user = user;
    newEntity.stockItem = stockItem;
    newEntity.marketItem = marketItem;

    return this.stockAccountRepository.save(newEntity);
  }

  async getEntityListByMarketItem(
    marketItem: MarketItemEntity,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.find(StockAccountEntity, {
      relations: ['user', 'stockItem'],
      where: {
        marketItem,
        stockItem: {
          isDeleted: false,
        },
      },
    });
  }

  // 2024.12.14 수정 - account 조회간 stockItem/marketItem의 isDeleted, isShow를 체크하도록 수정
  async getEntityByUserAndMarketItem(
    user: UserEntity,
    marketItem: MarketItemEntity,
    queryRunner: QueryRunner | null = null,
  ) {
    if (!queryRunner) {
      return this.stockAccountRepository.findOne({
        relations: ['stockItem'],
        where: {
          user,
          marketItem: {
            id: marketItem.id,
            isDeleted: false,
            isShow: true,
          },
          stockItem: {
            isDeleted: false,
          },
        },
      });
    } else {
      return queryRunner.manager.findOne(StockAccountEntity, {
        relations: ['stockItem'],
        where: {
          user,
          marketItem: {
            id: marketItem.id,
            isDeleted: false,
            isShow: true,
          },
          stockItem: {
            isDeleted: false,
          },
        },
      });
    }
  }

  // 2024.12.14 수정 - account 조회간 stockItem/marketItem의 isDeleted, isShow를 체크하도록 수정
  async getEntityByUserAndStockItem(
    user: UserEntity,
    stockItem: StockItemEntity,
    queryRunner: QueryRunner | null = null,
  ) {
    if (queryRunner) {
      return queryRunner.manager.findOne(StockAccountEntity, {
        relations: ['stockItem', 'marketItem', 'user'],
        where: {
          user,
          marketItem: { isDeleted: false, isShow: true },
          stockItem: {
            id: stockItem.id,
            isDeleted: false,
            isShow: true,
          },
        },
      });
    } else {
      return this.stockAccountRepository.findOne({
        relations: ['stockItem', 'marketItem', 'user'],
        where: {
          user,
          marketItem: { isDeleted: false, isShow: true },
          stockItem: {
            id: stockItem.id,
            isDeleted: false,
            isShow: true,
          },
        },
      });
    }
  }

  async isInSufficientBalance(
    volume: number,
    stockItem: StockItemEntity,
    user: UserEntity,
    queryRunner: QueryRunner | null = null,
  ) {
    if (queryRunner) {
      const account = await queryRunner.manager.findOne(StockAccountEntity, {
        where: {
          user: {
            id: user.id,
          },
          stockItem,
        },
      });

      if (!account)
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );

      return Number(account.volume) < Number(volume);
    } else {
      const account = await this.stockAccountRepository.findOne({
        where: {
          user: {
            id: user.id,
          },
          stockItem,
        },
      });

      if (!account)
        throw new ApiHttpException(
          RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );

      return Number(account.volume) < Number(volume);
    }
  }

  async increaseVolume(
    queryRunner: QueryRunner,
    volume: number,
    userId: number,
    stockItemId: number,
    marketItemId: number,
  ) {
    if (volume <= 0) {
      throw new ApiHttpException(
        RESPONSE_CODE.STOCK_ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 기존의 레코드가 있는지 확인
    const existingRecord = await queryRunner.manager.findOne(
      StockAccountEntity,
      {
        where: {
          user: { id: userId },
          stockItem: { id: stockItemId },
          marketItem: { id: marketItemId },
        },
      },
    );

    if (existingRecord) {
      // 레코드가 존재하면, volume을 증가시킵니다.
      await queryRunner.manager
        .createQueryBuilder()
        .update(StockAccountEntity)
        .set({ volume: () => `volume + ${volume}` })
        .where('user_id = :userId', { userId })
        .andWhere('stock_item_id = :stockItemId', { stockItemId })
        .andWhere('market_item_id = :marketItemId', { marketItemId })
        .execute();
    } else {
      // 레코드가 없으면, 새로운 레코드를 생성합니다.
      await queryRunner.manager.insert(StockAccountEntity, {
        user: { id: userId },
        stockItem: { id: stockItemId },
        marketItem: { id: marketItemId },
        volume,
      });
    }

    this.logger.log(
      `Successfully increase to Stock Account Volume: userId=${userId}, volume=${volume}`,
    );

    return true;
  }

  async decreaseVolume(
    queryRunner: QueryRunner,
    volume: number,
    userId: number,
    stockItemId: number,
    marketItemId: number,
  ) {
    if (volume <= 0) {
      throw new ApiHttpException(
        RESPONSE_CODE.STOCK_ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 기존의 레코드가 있는지 확인
    const existingRecord = await queryRunner.manager.findOne(
      StockAccountEntity,
      {
        where: {
          user: { id: userId },
          stockItem: { id: stockItemId },
          marketItem: { id: marketItemId },
        },
      },
    );

    if (!existingRecord) {
      throw new ApiHttpException(
        RESPONSE_CODE.STOCK_ACCOUNT_NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (Number(existingRecord.volume) < Number(volume)) {
      this.logger.error(
        `Insufficient volume: userId=${userId}, volume=${volume}`,
      );
      throw new ApiHttpException(
        RESPONSE_CODE.STOCK_ACCOUNT_INSUFFICIENT_VOLUME,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 레코드가 존재하면, volume을 감소시킵니다.
    await queryRunner.manager
      .createQueryBuilder()
      .update(StockAccountEntity)
      .set({ volume: () => `volume - ${volume}` })
      .where('user_id = :userId', { userId })
      .andWhere('stock_item_id = :stockItemId', { stockItemId })
      .andWhere('market_item_id = :marketItemId', { marketItemId })
      .execute();

    this.logger.log(
      `Successfully decrease to Stock Account Volume: userId=${userId}, volume=${volume}`,
    );
    return true;
  }
}
