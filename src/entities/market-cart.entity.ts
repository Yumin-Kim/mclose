import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import { CommonEntity } from '../common/database/common.entity';
import { UserEntity } from './user.entity';
import { MarketItemEntity } from './market-item.entity';

@Entity({
  name: 'mc_market_cart',
})
export class MarketCartEntity extends CommonEntity {
  // ------------------- relation -------------------
  @ManyToOne(() => UserEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @ManyToOne(() => MarketItemEntity, {
    createForeignKeyConstraints: false,
    lazy: false,
    nullable: true,
  })
  @JoinColumn({ name: 'market_item_id', referencedColumnName: 'id' })
  marketItem: MarketItemEntity;
}
