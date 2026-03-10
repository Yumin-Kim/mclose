// Purpose: TypeORM Common Entity for all entities to extend from.
import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class SQLiteCommonEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP',
    comment: '생성일',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '수정일',
  })
  updatedAt: Date;
}
