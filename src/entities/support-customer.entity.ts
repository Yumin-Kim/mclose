import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AdminEntity } from './admin.entity';
import { UserEntity } from './user.entity';

@Entity({
  name: 'mc_support_customer',
})
export class SupportCustomerEntity extends CommonEntity {
  // email
  @Column('varchar', {
    name: 'email',
    comment: 'email',
    length: 100,
  })
  email: string;

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

  // type
  @Column('enum', {
    name: 'type',
    comment: ' type : VIDEO(영상) , REFUND(환불) , SERVICE(서비스) , ETC(기타)',
    enum: ['VIDEO', 'REFUND', 'SERVICE', 'ETC'],
  })
  type: string;

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

  // response_content
  @Column('varchar', {
    name: 'response_content',
    comment: 'response_content',
    nullable: true,
    length: 1000,
  })
  responseContent: string;

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
