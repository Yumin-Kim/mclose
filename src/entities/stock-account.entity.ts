import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { StockItemEntity } from './stock-item.entity';
import { MarketItemEntity } from './market-item.entity';
import { MarketProfitPayoutHistoryEntity } from './market-profit-payout-history.entity';

@Entity({
  name: 'mc_stock_account',
})
export class StockAccountEntity extends CommonEntity {
  // volume: 지분 수량
  @Column('decimal', {
    name: 'volume',
    precision: 60,
    scale: 2,
    default: 100,
    comment: '지분 수량',
  })
  volume: number;

  // ------------------- relation -------------------

  // ManyToOne relation
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => StockItemEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_item_id', referencedColumnName: 'id' })
  stockItem: StockItemEntity;

  @ManyToOne(() => MarketItemEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'market_item_id', referencedColumnName: 'id' })
  marketItem: MarketItemEntity;

  @OneToMany(
    () => MarketProfitPayoutHistoryEntity,
    (marketProfitPayoutHistoryEntity) =>
      marketProfitPayoutHistoryEntity.stockAccount,
  )
  marketProfitPayoutHistories: MarketProfitPayoutHistoryEntity[];
}
