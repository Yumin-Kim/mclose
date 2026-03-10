import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { AccountHistoryEntity } from './account-history.entity';

@Entity({
  name: 'mc_account',
})
export class AccountEntity extends CommonEntity {
  @Column('decimal', {
    name: 'balance',
    precision: 60,
    scale: 2,
    comment: 'user account balance',
  })
  balance: number;

  @Column('enum', {
    name: 'currency',
    enum: ['CL', 'OS'],
    default: 'CL',
    comment: 'Enum: [CL,OS]',
  })
  currency: string;

  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @OneToMany(
    () => AccountHistoryEntity,
    (accountHistory) => accountHistory.account,
  )
  accountHistories: AccountHistoryEntity[];
}
