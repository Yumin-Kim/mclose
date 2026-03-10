import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { PromptHistoryEntity } from './prompt-history.entity';
import { RawVideoEntity } from './raw-video.entity';
import { MarketHistoryEntity } from './market-history.entity';
import { AccountEntity } from './account.entity';
import { SupportCustomerEntity } from './support-customer.entity';
import { MarketCartEntity } from './market-cart.entity';
import { UserMemoEntity } from './user-memo.entity';
import { SupportBussinessEntity } from './support-bussiness.entity';
import { PaymentHistoryEntity } from './payment-history.entity';
import { OutflowHistoryEntity } from './outflow-history.entity';
import { StockItemEntity } from './stock-item.entity';
import { StockOrderLiveEntity } from './stock-order-live.entity';
import { StockMatchEntity } from './stock-match.entity';
import { StockAccountEntity } from './stock-account.entity';
import { MarketLikeEntity } from './market-like.entity';
import { UsageHistoryEntity } from './usage-history.entity';
import { MarketProfitPayoutHistoryEntity } from './market-profit-payout-history.entity';
import { StockOrderCancelEntity } from './stock-order-cancel.entity';

@Entity({
  name: 'mc_user',
})
export class UserEntity extends CommonEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'real_name',
    comment: '실명',
  })
  realName: string;

  @Column('varchar', {
    name: 'login_id',
    nullable: true,
    comment: '로그인 아이디(이메일)',
    length: 100,
  })
  loginId: string;

  @Column('varchar', {
    name: 'login_pw',
    nullable: true,
    comment: 'hashing된 로그인 비밀번호',
    length: 100,
  })
  loginPw: string;

  @Column('int', {
    name: 'pw_round',
    nullable: true,
    comment: 'hashing 횟수',
  })
  pwRound: number;

  @Column('varchar', {
    name: 'phone_no',
    nullable: true,
    comment: '전화번호',
    length: 12,
  })
  phoneNo: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column('varchar', {
    name: 'birth_date',
    nullable: true,
    comment: '생년 월일',
    length: 100,
  })
  birthDate: string;

  @Column('enum', {
    name: 'gender',
    enum: ['MALE', 'FEMALE', 'OTHER'],
    nullable: true,
    comment: '성별',
  })
  gender: string;

  @Column('varchar', {
    name: 'jwt',
    nullable: true,
    comment: 'jwt',
    length: 500,
  })
  jwt?: string;

  @Column('enum', {
    name: 'role',
    enum: ['ADMIN', 'USER'],
    default: 'USER',
    comment: '사용자 권한 (ADMIN, USER)',
  })
  role: string;

  @Column('tinyint', {
    name: 'is_deleted',
    default: 0,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

  @Column('timestamp', {
    name: 'deleted_at',
    precision: 0,
    nullable: true,
  })
  deletedAt: Date;

  // banckcode
  @Column('varchar', {
    name: 'bank_code',
    nullable: true,
    comment: '은행 코드',
    length: 100,
  })
  bankCode: string;

  // account number
  @Column('varchar', {
    name: 'account_number',
    nullable: true,
    comment: '계좌번호',
    length: 100,
  })
  bankAccountNumber: string;

  // banck name
  @Column('varchar', {
    name: 'bank_name',
    nullable: true,
    comment: '은행명',
    length: 100,
  })
  bankName: string;

  // sign up retrial count
  @Column('int', {
    name: 'sign_in_retrial_count',
    nullable: true,
    default: 0,
    comment: '로그인 재시도 횟수',
  })
  signInRetrialCount: number;

  // last activity date
  @Column('timestamp', {
    name: 'last_activited_at',
    nullable: true,
    comment: '마지막 활동 날짜',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivitedAt: Date;

  // workspace_hashtag
  @Column('varchar', {
    name: 'workspace_hashtag',
    nullable: true,
    comment:
      '워크스페이스 해시태그 (최대 1000자) ,으로 구분하며 공백은 허용하지 않는다.',
    length: 1024,
  })
  workspaceHashtag: string;

  @Column('tinyint', {
    name: 'is_consent_used',
    default: 1,
    comment: '이용동의 여부',
  })
  isConsentUsed: boolean;

  @Column('tinyint', {
    name: 'is_consent_personal_info',
    default: 1,
    comment: '개인정보 이용동의 여부',
  })
  isConsentPersonalInfo: boolean;

  @Column('tinyint', {
    name: 'is_consent_marketing_info',
    default: 0,
    comment: '마케팅 이용동의 여부',
  })
  isConsentMarketingInfo: boolean;

  // ------------------- relation -------------------
  @OneToMany(() => PromptHistoryEntity, (promptHistory) => promptHistory.user)
  promptHistoryList: PromptHistoryEntity[];

  @OneToMany(() => RawVideoEntity, (rawVideo) => rawVideo.user)
  rawVideoList: RawVideoEntity[];

  @OneToMany(
    () => MarketHistoryEntity,
    (marketHistory) => marketHistory.buyUser,
  )
  buyMarketHistoryList: MarketHistoryEntity[];

  @OneToMany(
    () => MarketHistoryEntity,
    (marketHistory) => marketHistory.sellUser,
  )
  sellMarketHistoryList: MarketHistoryEntity[];

  @OneToMany(() => AccountEntity, (account) => account.user)
  accountList: AccountEntity[];

  @OneToMany(
    () => SupportCustomerEntity,
    (supportCustomer) => supportCustomer.user,
  )
  supportCustomerList: SupportCustomerEntity[];

  @OneToMany(
    () => SupportBussinessEntity,
    (supportBussiness) => supportBussiness.user,
  )
  supportBussinessList: SupportBussinessEntity[];

  @OneToMany(() => MarketCartEntity, (marketCart) => marketCart.user)
  marketCartList: MarketCartEntity[];

  @OneToMany(() => MarketLikeEntity, (marketLike) => marketLike.user)
  marketItemlikeList: MarketLikeEntity[];

  @OneToMany(
    () => PaymentHistoryEntity,
    (paymentHistory) => paymentHistory.user,
  )
  paymentHistoryList: PaymentHistoryEntity[];

  @OneToMany(
    () => OutflowHistoryEntity,
    (outflowHistory) => outflowHistory.user,
  )
  outflowHistoryList: OutflowHistoryEntity[];

  @OneToMany(() => StockItemEntity, (stockItem) => stockItem.user)
  stockItemList: StockItemEntity[];

  @OneToMany(
    () => StockOrderLiveEntity,
    (stockOrderLive) => stockOrderLive.user,
  )
  stockOrderLiveList: StockOrderLiveEntity[];

  @OneToMany(
    () => StockOrderCancelEntity,
    (stockOrderCancel) => stockOrderCancel.user,
  )
  stockOrderCancelList: StockOrderCancelEntity[];

  @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.buyUser)
  buyStockMatchList: StockMatchEntity[];

  @OneToMany(() => StockMatchEntity, (stockMatch) => stockMatch.sellUser)
  sellStockMatchList: StockMatchEntity[];

  @OneToMany(() => StockAccountEntity, (stockAccount) => stockAccount.user)
  stockAccountList: StockAccountEntity[];

  @OneToMany(() => UsageHistoryEntity, (usageHistory) => usageHistory.user)
  usageHistoryList: UsageHistoryEntity[];

  @OneToMany(
    () => MarketProfitPayoutHistoryEntity,
    (marketProfitPayoutHistoryEntity) => marketProfitPayoutHistoryEntity.buyer,
  )
  marketProfitPayoutBuyHistoryList: MarketProfitPayoutHistoryEntity[];

  @OneToMany(
    () => MarketProfitPayoutHistoryEntity,
    (marketProfitPayoutHistoryEntity) =>
      marketProfitPayoutHistoryEntity.stockholder,
  )
  marketProfitPayoutStockHolderHistoryList: MarketProfitPayoutHistoryEntity[];
}
