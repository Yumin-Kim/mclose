import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { StockOrderEntity } from '../entities/stock-order.entity';

@CustomRepository(StockOrderEntity)
export class StockOrderRepository extends Repository<StockOrderEntity> {}
