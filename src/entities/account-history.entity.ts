import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { AccountEntity } from './account.entity';

// 포인트 입출금 간 이력을 기록하는 테이블
// market에서 구맨한 기록은 남기지 않는다.
@Entity({
  name: 'mc_account_history',
  comment: `포인트 입출금 간 이력을 기록하는 테이블\n
    type으로 point와 asset을 구분한다.\n
    point는 애플리케이션에서 사용하는 포인트이며, asset은 실 자산이다.`,
})
@Index('account_history_idx', ['type', 'currency'])
export class AccountHistoryEntity extends CommonEntity {
  @Column('enum', {
    name: 'currency',
    enum: ['CL', 'OS', 'KRW'],
    nullable: false,
    comment: 'Enum: [CL,OS]',
  })
  currency: string;

  @Column('decimal', {
    name: 'amount',
    precision: 60,
    scale: 2,
    nullable: false,
    comment: '소모한 금액',
  })
  amount: number;

  @Column('enum', {
    name: 'type',
    enum: ['POINT', 'ASSET'],
    nullable: false,
    comment: 'type [POINT:포인트,ASSET:실 자산]',
  })
  type: string;

  @Column('enum', {
    name: 'status',
    enum: ['NONE', 'PENDING', 'CANCELED', 'UNCONFIRMED', 'CONFIRMED'],
    nullable: false,
    comment: 'history 상태 기록 [NONE,PENDING,CANCELED,UNCONFIRMED,CONFIRMED]',
  })
  status: string;

  @Column('enum', {
    name: 'ledger_type',
    enum: ['DEPOSIT', 'WITHDRAW'],
    nullable: false,
    comment: 'ledger type [DEPOSIT,WITHDRAW]',
  })
  ledgerType: string;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => AccountEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: AccountEntity;
}
