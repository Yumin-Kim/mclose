import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UsageHistoryEntity } from '../entities/usage-history.entity';

@CustomRepository(UsageHistoryEntity)
export class UsageHistoryRepository extends Repository<UsageHistoryEntity> {}
