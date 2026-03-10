import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Raw } from 'typeorm';
import { MarketHistoryEntity } from '../entities/market-history.entity';
import { StockMatchEntity } from '../entities/stock-match.entity';
import { StockItemEntity } from '../entities/stock-item.entity';
import { StockOrderEntity } from '../entities/stock-order.entity';

@Injectable()
export class AppScheduleService {
  private readonly logger = new Logger(AppScheduleService.name);
  private BATCH_DOWNLOAD_VIDEO_SIZE = 300;
  private BATCH_UPDATE_STOCK_ITEM_OPEN_PRICE_SIZE = 300;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // market Item의 download 기간을 검증하고 만료된 경우 status를 변경한다.
  @Cron('*/1 * * * *')
  async batchUpdateMarketItemForDownloadAt() {
    let affected = 0;
    this.logger.log(
      '[BATCH] ----------- START Update market item for download at -----------',
    );
    do {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const timestamp = await queryRunner.manager.query(
          `Select CURRENT_TIMESTAMP`,
        );
        this.logger.debug(
          `DATABASE timestamp: ${timestamp[0]['CURRENT_TIMESTAMP']}`,
        );

        // limit 1000개씩 처리
        const result = await queryRunner.manager
          .createQueryBuilder()
          .update(MarketHistoryEntity)
          .set({ isAvailableDownload: false })
          .where('availableDownloadAt < CURRENT_TIMESTAMP')
          .andWhere('isAvailableDownload = true')
          .limit(this.BATCH_DOWNLOAD_VIDEO_SIZE)
          .execute();

        await queryRunner.commitTransaction();
        if (result.affected === 0) {
          this.logger.warn(
            '----------- batchUpdateMarketItemForDownloadAt: No items to update -----------',
          );
          break;
        }

        this.logger.log(
          `----------- batchUpdateMarketItemForDownloadAt: ${result.affected} items -----------`,
        );

        affected = result.affected;
      } catch (err) {
        this.logger.error(
          ` ----------- batchUpdateMarketItemForDownloadAt -----------`,
        );
        console.log(err);
        await queryRunner.rollbackTransaction();
      } finally {
        if (!queryRunner.isReleased) {
          await queryRunner.release();
        }
      }
    } while (affected === this.BATCH_DOWNLOAD_VIDEO_SIZE);

    this.logger.debug('[BATCH] END Check download timeout market history');
  }

  // 23:59:59에 실행되는 배치
  // @Cron('*/1 * * * *')
  @Cron('59 59 23 * * *')
  async batchUpdateStockItemOpenPrice() {
    let offset = 0;
    this.logger.log(
      '[BATCH] ----------- START Update stock item open price -----------',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timestamp = await queryRunner.manager.query(
        `Select CURRENT_TIMESTAMP`,
      );
      this.logger.debug(
        `DATABASE timestamp: ${timestamp[0]['CURRENT_TIMESTAMP']}`,
      );

      const result = await queryRunner.manager
        .createQueryBuilder()
        .select('MAX(amount)', 'amount')
        .addSelect('stock_item_id', 'stockItemId')
        .addSelect('stockItem.open_price', 'closePrice')
        .from(StockMatchEntity, 'stockMatch')
        .leftJoin(
          StockItemEntity,
          'stockItem',
          'stockItem.id = stockMatch.stock_item_id',
        )
        .where('DATE(stockMatch.created_at) = CURDATE()')
        .groupBy('stock_item_id')
        .orderBy('stock_item_id', 'ASC')
        .getRawMany();

      if (result.length === 0) {
        this.logger.warn(
          ' ----------- batchUpdateStockItemOpenPrice: No items to update -----------',
        );
        return;
      }
      this.logger.log(
        ` ----------- batchUpdateStockItemOpenPrice: ${result.length} items -----------`,
      );

      while (offset < result.length) {
        const batchResult = result.slice(
          offset,
          offset + this.BATCH_UPDATE_STOCK_ITEM_OPEN_PRICE_SIZE,
        );

        // normalize
        // open price = amount
        // high price = amount + open price * 0.2
        // low price = amount - open price * 0.2
        // close price = current date - 1 day open price
        const normalizedResult = batchResult.map((item) => {
          const openPrice = Number(item.amount);
          const highPrice = openPrice + openPrice * 0.2;
          const lowPrice = openPrice - openPrice * 0.2;
          const closePrice = Number(item.closePrice);

          return {
            stockItemId: item.stockItemId,
            openPrice,
            highPrice,
            lowPrice,
            closePrice,
          };
        });

        // bulk update - on puplicate key update
        const queryValues = normalizedResult
          .map(() => `(?, ?, ?, ?, ?)`)
          .join(', ');

        const parameters = normalizedResult.flatMap((item) => [
          item.stockItemId,
          item.openPrice,
          item.highPrice,
          item.lowPrice,
          item.closePrice,
        ]);

        const sql = `
        INSERT INTO mc_stock_item (id, open_price, high_price, low_price, close_price)
        VALUES ${queryValues}
        ON DUPLICATE KEY UPDATE
        open_price = VALUES(open_price),
        high_price = VALUES(high_price),
        low_price = VALUES(low_price),
        close_price = VALUES(close_price)
      `;

        const affected = await queryRunner.manager.query(sql, parameters);

        this.logger.log(
          ` ----------- batchUpdateStockItemOpenPrice: ${affected.affectedRows} items updated -----------`,
        );

        offset += this.BATCH_UPDATE_STOCK_ITEM_OPEN_PRICE_SIZE;
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);

      this.logger.error(err);
      await queryRunner.rollbackTransaction();
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }

    this.logger.log('[BATCH] END Update stock item open price');
  }

  // 1H마다 mc_stock_order 테이블에서 volume이 0인 주문을 삭제한다.
  // @Cron('*/1 * * * *')
  @Cron('0 0 */1 * * *')
  async batchDeleteOrderVolumeZero() {
    this.logger.log(
      '[BATCH] ----------- START Delete order volume zero -----------',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(StockOrderEntity)
        .where('volume = 0')
        .execute();

      this.logger.log(
        ` ----------- batchDeleteOrderVolumeZero: ${result.affected} items deleted -----------`,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);

      this.logger.error(err);
      await queryRunner.rollbackTransaction();
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }

    this.logger.log('[BATCH] END Delete order volume zero');
  }
}
