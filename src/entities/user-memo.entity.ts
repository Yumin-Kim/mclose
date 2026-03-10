import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MarketItemEntity } from './market-item.entity';
import { AdminEntity } from './admin.entity';
import { UserEntity } from './user.entity';

@Entity({
  name: 'mc_user_memo',
})
export class UserMemoEntity extends CommonEntity {
  @Column('varchar', {
    name: 'content',
    comment: 'content',
    length: 1000,
  })
  content: string;

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
