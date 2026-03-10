import { Column, Entity, OneToMany } from 'typeorm';
import { TCreateAdminData } from '../interfaces/admin.interface';
import { UpdateAdminDto } from '../dto/admin.dto';
import { CommonEntity } from '../common/database/common.entity';
import { SupportCustomerEntity } from './support-customer.entity';
import { SupportFaqEntity } from './support-faq.entity';
import { OutflowHistoryEntity } from './outflow-history.entity';

@Entity({
  name: 'mc_admin',
})
export class AdminEntity extends CommonEntity {
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
    name: 'real_name',
    nullable: true,
    comment: '관리자 이름',
    length: 100,
  })
  realName: string;

  @Column('varchar', {
    name: 'phone_no',
    nullable: true,
    comment: '전화번호',
    length: 12,
  })
  phoneNo: string;

  @Column('varchar', {
    name: 'nickname',
    nullable: true,
    comment: '사용자 닉네임',
    length: 100,
  })
  nickName: string;

  @Column('varchar', {
    name: 'email',
    nullable: true,
    comment: '관리자 이메일',
    length: 100,
  })
  email: string;

  @Column('varchar', {
    name: 'jwt',
    nullable: true,
    comment: 'jwt',
    length: 500,
  })
  jwt?: string;

  @Column('enum', {
    name: 'role',
    enum: ['SUPER', 'CUSTOMER', 'EDITOR', 'COMMON'],
    default: 'SUPER',
    comment: '관리자 권한 (SUPER, CUSTOMER-CS , EDITOR-제작,COMMON-기획)',
  })
  role: string;

  @Column('varchar', {
    name: 'allow_ip',
    nullable: true,
    comment: '허용 IP',
  })
  allowIp: string;

  @Column('tinyint', {
    name: 'is_deleted',
    default: 0,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

  @Column('timestamp', {
    name: 'last_activited_at',
    nullable: true,
    comment: '마지막 활동 날짜',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivitedAt: Date;

  // ------------------- relation -------------------
  @OneToMany(
    () => SupportCustomerEntity,
    (supportCustomer) => supportCustomer.admin,
  )
  supportCustomerList: SupportCustomerEntity[];

  @OneToMany(() => SupportFaqEntity, (supportFaq) => supportFaq.admin)
  supportFaqList: SupportFaqEntity[];

  @OneToMany(
    () => OutflowHistoryEntity,
    (outflowHistory) => outflowHistory.admin,
  )
  outflowHistoryList: OutflowHistoryEntity[];

  // ------------------- static method -------------------
  static createAdmin(createAdminData: TCreateAdminData) {
    const newEntity = new AdminEntity();
    newEntity.loginId = createAdminData.loginId;
    newEntity.loginPw = createAdminData.loginPw;
    newEntity.pwRound = createAdminData.pwRound;
    newEntity.realName = createAdminData.realName;
    newEntity.email = createAdminData.email;
    newEntity.role = createAdminData.role;
    newEntity.nickName = createAdminData.nickName;
    newEntity.allowIp = createAdminData.ip || '';
    newEntity.phoneNo = createAdminData.phoneNo || '';
    return newEntity;
  }

  // ------------------- instance method -------------------
  updateAdminInfo(updateAdminData: UpdateAdminDto) {
    if (updateAdminData.loginId) this.loginId = updateAdminData.loginId;
    if (updateAdminData.realName) this.realName = updateAdminData.realName;
    if (updateAdminData.email) this.email = updateAdminData.email;
    if (updateAdminData.role) this.role = updateAdminData.role;
    if (updateAdminData.nickName) this.nickName = updateAdminData.nickName;
    if (updateAdminData.ip) this.allowIp = updateAdminData.ip;
  }

  updatePasswordInfo(loginPw: string, pwRound: number) {
    this.loginPw = loginPw;
    this.pwRound = pwRound;
  }
}
