import { DataSource, Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UserEntity } from '../entities/user.entity';
import { AccountHistoryEntity } from '../entities/account-history.entity';

@CustomRepository(AccountHistoryEntity)
export class AccountHistoryRepository extends Repository<AccountHistoryEntity> {}
