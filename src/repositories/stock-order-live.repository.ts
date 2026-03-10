import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { StockOrderLiveEntity } from '../entities/stock-order-live.entity';

@CustomRepository(StockOrderLiveEntity)
export class StockOrderLiveRepository extends Repository<StockOrderLiveEntity> {}
