import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { SupportBussinessEntity } from '../entities/support-bussiness.entity';

@CustomRepository(SupportBussinessEntity)
export class SupportBussinessRepository extends Repository<SupportBussinessEntity> {}
