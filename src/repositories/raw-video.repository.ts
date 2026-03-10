import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { RawVideoEntity } from '../entities/raw-video.entity';

@CustomRepository(RawVideoEntity)
export class RawVideoRepository extends Repository<RawVideoEntity> {}
