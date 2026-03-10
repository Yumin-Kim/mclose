import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { StockItemEntity } from './stock-item.entity';
import { StockMatchEntity } from './stock-match.entity';
import { StockOrderCancelEntity } from './stock-order-cancel.entity';

@Entity({
  name: 'mc_stock_order_live',
})
export class StockOrderLiveEntity extends CommonEntity {
  // volume: '거래량',
  @Column('decimal', {
    name: 'origin_volume',
    precision: 60,
    scale: 2,
    comment: '초기 생성 및 수정시 사용되는 거래량',
  })
  originVolume: number;

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

  // type: '매매 종류',
  @Column('enum', {
    name: 'type',
    enum: ['BUY', 'SELL'],
    comment: '매매 종류',
  })
  type: string;

  // status: '매매 상태',
  @Column('enum', {
    name: 'status',
    comment:
      '매매 상태\n WAIT: 대기, CANCELED: 취소, COMPLETE: 완료, HIDE: 숨김(관리자 전용)',
    enum: ['WAIT', 'CANCELED', 'COMPLETE', 'HIDE'],
  })
  status: string;

  @Column('timestamp', {
    name: 'deleted_at',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date;

  // TBD: need to check the type of 'is_show'
  @Column('tinyint', {
    name: 'is_deleted',
    default: 0,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

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

  @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.orderLive)
  matchList: StockMatchEntity[];

  @OneToMany(
    () => StockOrderCancelEntity,
    (stockOrderCancel) => stockOrderCancel.stockOrderLive,
  )
  stockOrderCancelList: StockOrderCancelEntity[];
}
