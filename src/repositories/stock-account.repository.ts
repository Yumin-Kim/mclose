import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { StockAccountEntity } from '../entities/stock-account.entity';

@CustomRepository(StockAccountEntity)
export class StockAccountRepository extends Repository<StockAccountEntity> {}
