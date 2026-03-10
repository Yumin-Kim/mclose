import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { OutflowHistoryEntity } from '../entities/outflow-history.entity';

@CustomRepository(OutflowHistoryEntity)
export class OutflowHistoryEntityRepository extends Repository<OutflowHistoryEntity> {}
