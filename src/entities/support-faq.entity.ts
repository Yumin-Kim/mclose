import { CommonEntity } from '../common/database/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AdminEntity } from './admin.entity';

@Entity({
  name: 'mc_support_faq',
})
export class SupportFaqEntity extends CommonEntity {
  @Column('varchar', {
    name: 'title',
    comment: 'title',
    length: 1000,
  })
  title: string;

  @Column('varchar', {
    name: 'content',
    comment: 'content',
    length: 1000,
  })
  content: string;

  // ------------------------------ relations ------------------------------

  @ManyToOne(() => AdminEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: AdminEntity;
}
