import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UserEntity } from '../entities/user.entity';
import { MarketCartEntity } from '../entities/market-cart.entity';

@CustomRepository(MarketCartEntity)
export class MarketCartRepository extends Repository<MarketCartEntity> {}
