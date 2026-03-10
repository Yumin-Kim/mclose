import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { SupportFaqEntity } from '../entities/support-faq.entity';

@CustomRepository(SupportFaqEntity)
export class SupportFaqRepository extends Repository<SupportFaqEntity> {}
