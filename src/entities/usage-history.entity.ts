import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'mc_usage_history',
})
export class UsageHistoryEntity extends CommonEntity {
  @Column({
    name: 'type',
    type: 'enum',
    enum: ['MARKET', 'STOCK_MATCH_BUY', 'PROMPT'],
    default: 'MARKET',
    comment:
      'Enum: [MARKET : 마켓 제품 구매시 , STOCK_MATCH_BUY : 지분 matching 된 경우, PROMPT : 프롬프트 요청시]',
  })
  type: string;

  @Column({
    name: 'ref_id',
    type: 'int',
    nullable: true,
    comment:
      'MARKET : mc_market_item.id, STOCK_MATCH_BUY : mc_stock_item.id, PROMPT : mc_prompt_history.id',
  })
  refId: number;

  @Column('enum', {
    name: 'currency',
    enum: ['CL', 'OS'],
    default: 'CL',
    comment: 'Enum: [CL,OS]',
  })
  currency: string;

  @Column('decimal', {
    name: 'amount',
    precision: 60,
    scale: 2,
    comment: '소모된 금액',
  })
  amount: number;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;
}
