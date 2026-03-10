import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { AccountEntity } from './account.entity';
import { MarketHistoryEntity } from './market-history.entity';
import { StockAccountEntity } from './stock-account.entity';

// 포인트 입출금 간 이력을 기록하는 테이블
// market에서 구맨한 기록은 남기지 않는다.
@Entity({
  name: 'mc_market_profit_payout_history',
  comment: `영상 구매간 상품에 대한 할당 받은 지분에 따른 수익금 지급 이력을 기록하는 테이블`,
})
export class MarketProfitPayoutHistoryEntity extends CommonEntity {
  // 지불 금액
  @Column('decimal', {
    name: 'spend_amount',
    precision: 60,
    scale: 2,
    nullable: false,
    comment: '소모한 금액',
  })
  spendAmount: number;

  // 지분 수익금
  @Column('decimal', {
    name: 'profit_amount',
    precision: 60,
    scale: 2,
    nullable: false,
    comment: '지분 수익금',
  })
  profitAmount: number;

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
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'buy_user_id', referencedColumnName: 'id' })
  buyer: UserEntity;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_holder_user_id', referencedColumnName: 'id' })
  stockholder: UserEntity;

  @ManyToOne(() => MarketHistoryEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'market_history_id', referencedColumnName: 'id' })
  marketHistory: MarketHistoryEntity;

  @ManyToOne(() => StockAccountEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_account_id', referencedColumnName: 'id' })
  stockAccount: StockAccountEntity;
}
