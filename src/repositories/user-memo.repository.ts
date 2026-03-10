import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UserMemoEntity } from '../entities/user-memo.entity';

@CustomRepository(UserMemoEntity)
export class UserMemoRepository extends Repository<UserMemoEntity> {}
