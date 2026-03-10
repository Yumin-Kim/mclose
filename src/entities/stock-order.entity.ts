import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { StockItemEntity } from './stock-item.entity';

@Entity({
  name: 'mc_stock_order',
  comment: '지분 item 별 총 가격별 거래량을 기록하기 위한 테이블',
})
export class StockOrderEntity extends CommonEntity {
  // volume: '거래량',
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
  // ------------------- relation -------------------
  // ManyToOne relation
  @ManyToOne(() => StockItemEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'stock_item_id', referencedColumnName: 'id' })
  stockItem: StockItemEntity;
}
