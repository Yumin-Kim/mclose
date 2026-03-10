// import { CommonEntity } from '../common/database/common.entity';
// import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
// import { MarketItemEntity } from './market-item.entity';
// import { AdminEntity } from './admin.entity';

// @Entity({
//   name: 'mc_market_item_memo',
// })
// export class MarketItemMemoEntity extends CommonEntity {
//   @Column('varchar', {
//     name: 'title',
//     comment: 'title',
//     length: 1000,
//   })
//   title: string;
//   @Column('varchar', {
//     name: 'content',
//     comment: 'content',
//     length: 1000,
//   })
//   content: string;

//   // ------------------- relation -------------------
//   @ManyToOne(() => MarketItemEntity, {
//     createForeignKeyConstraints: false,
//     lazy: false,
//     nullable: true,
//   })
//   @JoinColumn({ name: 'market_item_id', referencedColumnName: 'id' })
//   marketItem: MarketItemEntity;

//   @ManyToOne(() => AdminEntity, {
//     createForeignKeyConstraints: false,
//     lazy: false,
//     nullable: true,
//   })
//   @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
//   admin: AdminEntity;
// }
