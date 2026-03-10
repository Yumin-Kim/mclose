import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AdminEntity } from './admin.entity';
import { UserEntity } from './user.entity';

@Entity({
  name: 'mc_support_bussiness',
})
export class SupportBussinessEntity extends CommonEntity {
  // real_name
  @Column('varchar', {
    name: 'real_name',
    comment: 'real_name',
    length: 100,
  })
  realName: string;

  // phone_no
  @Column('varchar', {
    name: 'phone_no',
    comment: 'phone_no',
    length: 100,
  })
  phoneNo: string;

  @Column('varchar', {
    name: 'email',
    comment: 'email',
    length: 100,
  })
  email: string;

  @Column('varchar', {
    name: 'content',
    comment: 'content',
    length: 1000,
  })
  content: string;

  @Column('enum', {
    name: 'status',
    comment: 'status',
    enum: ['PENDING', 'PROGRESS', 'CONFIRMED', 'CANCELED'],
    default: 'PENDING',
  })
  status: string;

  // company_no
  @Column('varchar', {
    name: 'company_no',
    comment: '회사번호',
    length: 100,
    nullable: true,
  })
  companyNo: string;

  // company_name
  @Column('varchar', {
    name: 'company_name',
    comment: '회사명',
    length: 100,
    nullable: true,
  })
  companyName: string;

  // company_part_name
  @Column('varchar', {
    name: 'company_part_name',
    comment: '부서명',
    length: 100,
    nullable: true,
  })
  companyPartName: string;

  @Column('tinyint', {
    name: 'is_optional_required',
    comment: '선택항목 필수여부',
    default: 0,
  })
  isOptionalRequired: boolean;

  // ------------------- relation -------------------
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
