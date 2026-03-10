import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { SupportCustomerEntity } from '../entities/support-customer.entity';

@CustomRepository(SupportCustomerEntity)
export class SupportCustomerRepository extends Repository<SupportCustomerEntity> {}
