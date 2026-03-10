import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { StockItemEntity } from './stock-item.entity';
import { StockOrderLiveEntity } from './stock-order-live.entity';

@Entity({
  name: 'mc_stock_order_cancel',
})
export class StockOrderCancelEntity extends CommonEntity {
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

  @Column('enum', {
    name: 'reg_type',
    comment:
      '삭제 취소 제공처 : 1.구매자 주문 취소:BUYER_CANCEL, 2.판매자 주문 취소:SELLER_CANCEL 3.판매자 상품 삭제 :SELLER_DELETE, 4.관리자 주문 삭제:ADMIN_DELETE',
    enum: ['BUYER_CANCEL', 'SELLER_CANCEL', 'SELLER_DELETE', 'ADMIN_DELETE'],
  })
  regType: string;

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

  @ManyToOne(() => StockOrderLiveEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_order_live_id', referencedColumnName: 'id' })
  stockOrderLive: StockOrderLiveEntity;

  // @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.buyOrderLive)
  // buyMatchList: StockMatchEntity[];

  // @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.sellOrderLive)
  // sellMatchList: StockMatchEntity[];
}
