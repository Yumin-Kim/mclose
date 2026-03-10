import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../entities/user.entity';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { AccountService } from '../account.service';
import { AccountHistoryService } from '../account-history.service';
import {
  ACCOUNT_CURRENCY,
  DOWNLOAD_FINISHED_CNT,
  MARKET_HISTORY_STATUS,
} from '../../constant';
import { MarketItemService } from './market-item.service';
import { UserService } from '../user.service';
import { MarketHistoryEntity } from '../../entities/market-history.entity';

@Injectable()
export class MarketHistoryService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly accountService: AccountService,
    private readonly accountHistoryService: AccountHistoryService,
    private readonly marketItemService: MarketItemService,
    private readonly userService: UserService,
  ) {}

  async create(
    buyer: UserEntity,
    marketItem: MarketItemEntity,
    queryRunner: QueryRunner,
    remainAmount: number,
    feeAmount: number,
    isExistStock: boolean,
  ) {
    const sql = `
      INSERT INTO mc_market_history (
          market_item_id,
          buy_user_id,
          sell_user_id,
          price,
          status,
          is_available_download,
          cumulative_sales_amount,
          cumulative_purchase_cnt,
          cumulative_view_cnt,
          available_download_at,
          created_at,
          amount,
          fee_amount,
          is_registered_stock
      )
      VALUES (
          ?, ?, ?, ?, 'COMPLETED', 1,
          (
              SELECT * FROM (
                SELECT COALESCE(MAX(cumulative_sales_amount), 0)
                FROM mc_market_history
                WHERE market_item_id = ?
                ORDER BY id DESC
                LIMIT 1
              ) AS t
          ) + ?,
          ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), NOW() , ?, ? , ?
      )
      ON DUPLICATE KEY UPDATE
          cumulative_sales_amount = cumulative_sales_amount + VALUES(cumulative_sales_amount),
          cumulative_purchase_cnt = cumulative_purchase_cnt + VALUES(cumulative_purchase_cnt),
          cumulative_view_cnt = cumulative_view_cnt + VALUES(cumulative_view_cnt),
          updated_at = NOW();
    `;

    const params = [
      marketItem.id, // market_item_id
      buyer.id, // buy_user_id
      marketItem.user.id, // sell_user_id
      marketItem.price, // price
      marketItem.id, // market_item_id for subquery
      marketItem.price, // additionalSalesAmount
      Number(marketItem.purchaseCnt) + 1, // additionalPurchaseCnt
      marketItem.viewCnt, // viewCount
      DOWNLOAD_FINISHED_CNT, // downloadDays
      remainAmount, // amount
      feeAmount, // feeAmount
      isExistStock, // isRegisteredStock
    ];

    const result = await queryRunner.query(sql, params);

    return result.insertId;
  }

  async list(user: UserEntity) {}
}
