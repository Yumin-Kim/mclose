import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { PromptHistoryEntity } from '../entities/prompt-history.entity';

@CustomRepository(PromptHistoryEntity)
export class PromptHistoryRepository extends Repository<PromptHistoryEntity> {}
