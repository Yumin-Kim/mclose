import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { PromptHistoryEntity } from './prompt-history.entity';
import { MarketItemEntity } from './market-item.entity';
import { StockItemEntity } from './stock-item.entity';

@Entity({
  name: 'mc_raw_video',
})
export class RawVideoEntity extends CommonEntity {
  @Column('varchar', {
    name: 'title',
    comment: '내프로젝트 제못',
    length: 400,
  })
  title: string;

  @Column('varchar', {
    name: 'origin_video_url',
    comment: 'Video URL',
    nullable: true,
  })
  originVideoUrl: string;

  @Column('varchar', {
    name: 'water_mark_video_url',
    comment: 'Video URL',
    nullable: true,
  })
  watermarkVideoUrl: string;

  @Column('varchar', {
    name: 'video_resolution',
    comment: 'Video Resolution(ffmpeg resolution: 640x360)',
    nullable: true,
  })
  videoResolution: string;

  @Column('varchar', {
    name: 'video_duration',
    comment: 'Video Duration (ffmpeg duration: 1114624)',
    nullable: true,
  })
  videoDuration: string;

  @Column('varchar', {
    name: 'video_format',
    comment: 'Video Format (ffmpeg format: mp4, avi, ...)',
    nullable: true,
  })
  videoFormat: string;

  @Column('varchar', {
    name: 'video_ratio',
    comment: 'Video ratio(ffmpeg display_aspect_ratio: 16:9, 4:3, ...)',
    nullable: true,
  })
  videoRatio: string;

  @Column('varchar', {
    name: 'workspace_hashtag',
    comment:
      '워크스페이스 해시태그 (최대 1000자) ,으로 구분하며 공백은 허용하지 않는다.',
    nullable: true,
    length: 1000,
  })
  workspaceHashTag: string;

  @Column('varchar', {
    name: 'command_uuid',
    comment: 'Command UUID (Video Daemon Service)',
    length: 45,
  })
  commandUUID: string;

  @Column('text', {
    name: 'meta_data',
    comment: 'Meta Data',
    nullable: true,
  })
  metaData: string;

  @Column('timestamp', {
    name: 'deleted_at',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date;

  @Column('tinyint', {
    name: 'is_deleted',
    default: 0,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => PromptHistoryEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'prompt_history_id', referencedColumnName: 'id' })
  promptHistory: PromptHistoryEntity;

  // OnetoMay relation
  @OneToMany(() => MarketItemEntity, (marketItem) => marketItem.rawVideo)
  marketItemList: MarketItemEntity[];

  @OneToMany(() => StockItemEntity, (stockItem) => stockItem.rawVideo)
  stockItemList: StockItemEntity[];
}
