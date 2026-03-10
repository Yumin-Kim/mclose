import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { RawVideoEntity } from './raw-video.entity';
import { MarketHistoryEntity } from './market-history.entity';
import { MarketCartEntity } from './market-cart.entity';
import { MarketLikeEntity } from './market-like.entity';
import { StockItemEntity } from './stock-item.entity';
import { StockAccountEntity } from './stock-account.entity';

@Entity({
  name: 'mc_market_item',
})
export class MarketItemEntity extends CommonEntity {
  @Column('varchar', {
    name: 'thumbnail_url',
    comment: 'Thumbnail URL',
  })
  thumbnailUrl: string;

  @Column('decimal', {
    name: 'thumbnail_start_time',
    precision: 60,
    scale: 2,
    comment: 'Thumbnail Start Time',
  })
  thumbnailStartTime: number;

  @Column('text', {
    name: 'meta_data',
    nullable: true,
    comment: 'Meta Data',
  })
  metaData: string;

  @Column('decimal', {
    name: 'price',
    precision: 60,
    scale: 2,
    comment: 'Price',
  })
  price: number;

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

  @Column('varchar', {
    name: 'hashtag',
    comment: 'hashtag example,hello,world',
    nullable: true,
    length: 1000,
  })
  hashTag: string;

  @Column('int', {
    name: 'like_cnt',
    comment: 'like count',
    default: 0,
  })
  likeCnt: number;

  @Column('int', {
    name: 'view_cnt',
    comment: 'view count',
    default: 0,
  })
  viewCnt: number;

  @Column('int', {
    name: 'purchase_cnt',
    comment: 'purchase count',
    default: 0,
  })
  purchaseCnt: number;

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
    () => MarketHistoryEntity,
    (marketHistory) => marketHistory.marketItem,
  )
  marketHistoryList: MarketHistoryEntity[];

  @OneToMany(() => MarketCartEntity, (marketCart) => marketCart.marketItem)
  marketCartList: MarketCartEntity[];

  @OneToMany(() => MarketLikeEntity, (marketLike) => marketLike.marketItem)
  marketItemLikeList: MarketLikeEntity[];

  @OneToMany(() => StockAccountEntity, (marketLike) => marketLike.marketItem)
  stockAccountList: StockAccountEntity[];
}
