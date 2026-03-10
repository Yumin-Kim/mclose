import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { StockItemEntity } from '../entities/stock-item.entity';

@CustomRepository(StockItemEntity)
export class StockItemRepository extends Repository<StockItemEntity> {}
