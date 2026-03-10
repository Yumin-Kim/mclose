import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { MarketLikeEntity } from '../entities/market-like.entity';

@CustomRepository(MarketLikeEntity)
export class MarketLikeRepository extends Repository<MarketLikeEntity> {}
