import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { StockMatchEntity } from '../entities/stock-match.entity';

@CustomRepository(StockMatchEntity)
export class StockMatchRepository extends Repository<StockMatchEntity> {}
