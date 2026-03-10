import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { MarketHistoryEntity } from '../entities/market-history.entity';

@CustomRepository(MarketHistoryEntity)
export class MarketHistoryRepository extends Repository<MarketHistoryEntity> {}
