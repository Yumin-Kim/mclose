import { DataSource, Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { AccountEntity } from '../entities/account.entity';

@CustomRepository(AccountEntity)
export class AccountRepository extends Repository<AccountEntity> {}
