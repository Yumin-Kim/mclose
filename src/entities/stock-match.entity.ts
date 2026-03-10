import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { StockOrderLiveEntity } from './stock-order-live.entity';
import { StockItemEntity } from './stock-item.entity';

@Entity({
  name: 'mc_stock_match',
})
export class StockMatchEntity extends CommonEntity {
  // volume: '거래량',
  @Column('decimal', {
    name: 'total_amount',
    precision: 60,
    scale: 2,
    comment: '거래량 * 가격',
  })
  totalAmount: number;

  @Column('decimal', {
    name: 'original_volume',
    precision: 60,
    scale: 2,
    comment: '체결 시점 등록된 거래량',
  })
  originalVolume: number;

  @Column('decimal', {
    name: 'volume',
    precision: 60,
    scale: 2,
    comment: '거래량',
  })
  volume: number;

  // amount: '거래금액',
  @Column('decimal', {
    name: 'amount',
    precision: 60,
    scale: 2,
    comment: '거래금액',
  })
  amount: number;

  // fee amount: '수수료 금액',
  @Column('decimal', {
    name: 'fee_amount',
    precision: 60,
    scale: 2,
    comment: '수수료 금액',
  })
  feeAmount: number;

  // @Column('enum', {
  //   name: 'type',
  //   enum: ['BUY', 'SELL'],
  //   comment: '매매 종류',
  // })
  // type: string;

  // ------------------- relation -------------------

  // ManyToOne relation
  @ManyToOne(() => StockOrderLiveEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'order_live_id', referencedColumnName: 'id' })
  orderLive: StockOrderLiveEntity;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'buy_user_id', referencedColumnName: 'id' })
  buyUser: UserEntity;

  // @ManyToOne(() => StockOrderLiveEntity, {
  //   createForeignKeyConstraints: false,
  //   lazy: false,
  //   nullable: true,
  // })
  // @JoinColumn({ name: 'buy_order_id', referencedColumnName: 'id' })
  // buyOrderLive: StockOrderLiveEntity;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'sell_user_id', referencedColumnName: 'id' })
  sellUser: UserEntity;

  // @ManyToOne(() => StockOrderLiveEntity, {
  //   createForeignKeyConstraints: false,
  //   lazy: false,
  //   nullable: true,
  // })
  // @JoinColumn({ name: 'sell_order_id', referencedColumnName: 'id' })
  // sellOrderLive: StockOrderLiveEntity;

  @ManyToOne(() => StockItemEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_item_id', referencedColumnName: 'id' })
  stockItem: StockItemEntity;
}
