import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { RawVideoEntity } from './raw-video.entity';
import { StockOrderLiveEntity } from './stock-order-live.entity';
import { StockMatchEntity } from './stock-match.entity';
import { StockAccountEntity } from './stock-account.entity';
import { StockOrderEntity } from './stock-order.entity';
import { StockOrderCancelEntity } from './stock-order-cancel.entity';

@Entity({
  name: 'mc_stock_item',
})
export class StockItemEntity extends CommonEntity {
  // open_price: '시가',
  @Column('decimal', {
    name: 'open_price',
    precision: 60,
    scale: 2,
    comment: '시가',
    nullable: true,
  })
  openPrice: number;

  // close_price: '종가',
  @Column('decimal', {
    name: 'close_price',
    precision: 60,
    scale: 2,
    comment: '전일 종가',
    nullable: true,
  })
  closePrice: number;

  // high_price: '고가',
  @Column('decimal', {
    name: 'high_price',
    precision: 60,
    scale: 2,
    comment: '고가',
    nullable: true,
  })
  highPrice: number;

  // low_price: '저가',
  @Column('decimal', {
    name: 'low_price',
    precision: 60,
    scale: 2,
    comment: '저가',
    nullable: true,
  })
  lowPrice: number;

  // 초기 가격
  @Column('decimal', {
    name: 'initial_price',
    precision: 60,
    scale: 2,
    comment: '초기 가격',
    nullable: true,
  })
  initialPrice: number;

  @Column('varchar', {
    name: 'thumbnail_url',
    comment: 'Thumbnail URL',
    nullable: true,
  })
  thumbnailUrl: string;

  @Column('decimal', {
    name: 'thumbnail_start_time',
    precision: 60,
    scale: 2,
    comment: 'Thumbnail Start Time',
  })
  thumbnailStartTime: number;

  @Column('varchar', {
    name: 'name',
    comment: 'Item Name code (ex: YYYYMMDDHHmmss)',
    nullable: true,
    length: 100,
  })
  name: string;

  @Column('varchar', {
    name: 'title',
    comment: 'title',
    nullable: true,
    length: 1000,
  })
  title: string;

  @Column('int', {
    name: 'view_cnt',
    comment: 'view count',
    default: 0,
  })
  viewCnt: number;

  @Column('int', {
    name: 'match_cnt',
    comment: '체결 수',
    default: 0,
  })
  matchCnt: number;

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

  // TBD: need to check the type of 'is_show'
  @Column('tinyint', {
    name: 'is_show',
    default: 1,
    comment: '노출 여부',
  })
  isShow: boolean;

  // issue_comment: '이슈 항목 가록',
  @Column('varchar', {
    name: 'issue_comment',
    nullable: true,
    comment: '이슈 항목 가록',
    length: 1000,
  })
  issueComment: string;

  // ------------------- relation -------------------

  // ManyToOne relation
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => RawVideoEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'raw_video_id', referencedColumnName: 'id' })
  rawVideo: RawVideoEntity;

  // OneToMany relation
  @OneToMany(
    () => StockOrderLiveEntity,
    (stockOrderLive) => stockOrderLive.stockItem,
  )
  stockOrderLiveList: StockOrderLiveEntity[];

  @OneToMany(
    () => StockOrderCancelEntity,
    (stockOrderCancel) => stockOrderCancel.stockItem,
  )
  stockOrderCancelList: StockOrderCancelEntity[];

  @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.stockItem)
  stockMatchList: StockMatchEntity[];

  @OneToMany(() => StockAccountEntity, (stockAccount) => stockAccount.stockItem)
  stockAccountList: StockAccountEntity[];

  @OneToMany(() => StockOrderEntity, (stockOrder) => stockOrder.stockItem)
  stockOrderList: StockOrderEntity[];
}
