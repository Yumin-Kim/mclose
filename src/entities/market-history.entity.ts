import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { MarketItemEntity } from './market-item.entity';
import { MarketProfitPayoutHistoryEntity } from './market-profit-payout-history.entity';

@Entity({
  name: 'mc_market_history',
  comment: `market에서 거래한 기록을 남기는 테이블\n`,
})
export class MarketHistoryEntity extends CommonEntity {
  @Column('decimal', {
    name: 'price',
    precision: 60,
    scale: 2,
    comment: '구매 영상 상품의 가격 정보',
  })
  price: number;

  @Column('enum', {
    name: 'status',
    enum: ['WAITING', 'CANCELED', 'COMPLETED', 'REFUNDED'],
    default: 'WAITING',
    comment: 'Enum: [WAITING, CANCELED, COMPLETED, REFUNDED]',
  })
  status: string;
  // status: 'WAITING' | 'CANCELED' | 'COMPLETED' | 'REFUNDED';

  @Column('timestamp', {
    name: 'available_download_at',
    precision: 0,
    default: () => 'CURRENT_TIMESTAMP',
    // nullable: false,
  })
  availableDownloadAt: Date;

  @Column('tinyint', {
    name: 'is_available_download',
    default: 0,
    comment: '다운로드 가능 여부',
  })
  isAvailableDownload: boolean;

  @Column('tinyint', {
    name: 'is_deleted',
    default: 0,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

  @Column('timestamp', {
    name: 'deleted_at',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date;

  @Column('decimal', {
    name: 'cumulative_sales_amount',
    precision: 60,
    scale: 2,
    comment: '누적 판매 금액',
  })
  cumulativeSalesAmount: number;

  @Column('int', {
    name: 'cumulative_purchase_cnt',
    comment: 'view count',
    default: 0,
  })
  cumulativePurchaseCnt: number;

  @Column('int', {
    name: 'cumulative_view_cnt',
    comment: 'view count',
    default: 0,
  })
  cumulativeViewCnt: number;

  @Column('decimal', {
    name: 'fee_amount',
    precision: 60,
    scale: 2,
    comment: '수수료 금액',
    default: 0,
  })
  feeAmount: number;

  @Column('decimal', {
    name: 'amount',
    precision: 60,
    scale: 2,
    comment: 'account에 반영된 금액',
    default: 0,
  })
  amount: number;

  @Column('tinyint', {
    name: 'is_registered_stock',
    default: 0,
    comment: '지분 등록 여부',
  })
  isRegisteredStock: boolean;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'buy_user_id', referencedColumnName: 'id' })
  buyUser: UserEntity;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'sell_user_id', referencedColumnName: 'id' })
  sellUser: UserEntity;

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
      marketProfitPayoutHistoryEntity.marketHistory,
  )
  marketProfitPayoutHistoryList: MarketProfitPayoutHistoryEntity[];
}
