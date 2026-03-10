import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UserEntity } from '../entities/user.entity';

@CustomRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {}
