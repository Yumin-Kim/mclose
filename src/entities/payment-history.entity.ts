import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { CommonEntity } from '../common/database/common.entity';
import { UserEntity } from './user.entity';

// createdAt: 결제 생성일시
// updatedAt: 결제 수정일시
// 결제 응답 일시 :
// 결제 취소 일시 :
@Entity({
  name: 'mc_payment_history',
})
export class PaymentHistoryEntity extends CommonEntity {
  @Column('enum', {
    name: 'currency',
    comment: 'CL,OS',
    enum: ['CL', 'OS'],
    default: 'CL',
  })
  currency: string;

  // merchant_uid
  @Column('varchar', {
    name: 'imp_uid',
    comment: 'portone 생성 결제 고유번호',
    length: 100,
    nullable: true,
  })
  impUid: string;

  // merchant_uid
  @Column('varchar', {
    name: 'merchant_uid',
    comment: 'mclose 결제 요청 고유번호',
    length: 100,
  })
  merchantUid: string;

  // pay_method
  @Column('varchar', {
    name: 'pay_method',
    comment: '결제수단 코드(카드, 가상계좌, 휴대폰 등)',
    length: 100,
  })
  payMethod: string;

  // pg_provider_code
  @Column('varchar', {
    name: 'pg_provider_code',
    comment: 'PG사 이름',
    length: 100,
  })
  pgProvider: string;

  // amount
  @Column('int', {
    name: 'amount',
    comment: '결제금액- 현금',
  })
  amount: number;

  // amount
  @Column('int', {
    name: 'charge_amount',
    comment: '충전 금액 - 포인트',
    nullable: true,
  })
  chargeAmount: number;

  // status
  @Column('enum', {
    name: 'status',
    comment: '결제상태 : READY(결제대기), PAID(결제완료), CANCELED(결제취소), OUTFLOW(정산 완료) , OUTFLOW_CANCELED(정산 취소)',
    enum: ['READY', 'PAID', 'CANCELED', 'OUTFLOW', 'OUTFLOW_CANCELED'],
    default: 'READY',
  })
  status: string;

  // 결제 응답 일시 //
  @Column('datetime', {
    name: 'paid_at',
    comment:
      '결제 응답 일시(결제 완료 또는 취소 시간 기록 오로지 기록용으로 사용)',
    nullable: true,
  })
  paidAt: Date;

  @Column('varchar', {
    name: 'error_code',
    comment: '결제 실패시 에러코드',
    length: 100,
    nullable: true,
  })
  errorCode: string;

  @Column('varchar', {
    name: 'error_msg',
    comment: '결제 실패시 에러메시지',
    length: 100,
    nullable: true,
  })
  errorMsg: string;

  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;
}
