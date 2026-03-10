import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { CommonEntity } from '../common/database/common.entity';
import { UserEntity } from './user.entity';
import { AdminEntity } from './admin.entity';

@Entity({
  name: 'mc_outflow_history',
  comment: '환불 , 정산 이력',
})
export class OutflowHistoryEntity extends CommonEntity {
  // currency
  @Column('enum', {
    name: 'currency',
    enum: ['CL', 'OS'],
    default: 'CL',
    comment: 'Enum: [CL,OS]',
  })
  currency: string;

  // amount
  @Column('decimal', {
    name: 'origin_amount',
    precision: 60,
    scale: 2,
    comment: '수수료 차감 전 금액 - 정산 입력 금액',
  })
  originAmount: number;

  @Column('decimal', {
    name: 'expected_amount',
    precision: 60,
    scale: 2,
    comment: '수수료 차감 후 금액 - 정산 예상 금액 ',
  })
  expectedAmount: number;

  // fee
  @Column('decimal', {
    name: 'fee',
    precision: 60,
    scale: 2,
    comment: '수수료',
  })
  fee: number;

  // type
  @Column('enum', {
    name: 'type',
    comment: '환불, 정산 타입 : REFUND(환불), SETTLEMENT(정산)',
    enum: ['REFUND', 'SETTLEMENT'],
  })
  type: string;

  // status
  @Column('enum', {
    name: 'status',
    comment:
      '환불, 정산 상태 : READY(환불대기), PROGRESS(환불처리중), CONFIRMED(환불완료), CANCELED(환불취소)',
    enum: ['PENDING', 'PROGRESS', 'CONFIRMED', 'CANCELED'],
    default: 'PENDING',
  })
  status: string;

  // 처리 일시
  @Column('timestamp', {
    name: 'process_at',
    comment: '환불, 정산 처리 일시',
    nullable: true,
    precision: 0,
  })
  processAt: Date;

  // banckcode
  @Column('varchar', {
    name: 'reg_bank_code',
    nullable: true,
    comment: '은행 코드',
    length: 100,
  })
  regBankCode: string;

  // account number
  @Column('varchar', {
    name: 'reg_account_number',
    nullable: true,
    comment: '계좌번호',
    length: 100,
  })
  regBankAccountNumber: string;

  // banck name
  @Column('varchar', {
    name: 'reg_bank_name',
    nullable: true,
    comment: '은행명',
    length: 100,
  })
  regBankName: string;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => AdminEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: AdminEntity;
}
