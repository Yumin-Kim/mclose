import { DataSource, Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { PaymentHistoryEntity } from '../entities/payment-history.entity';

@CustomRepository(PaymentHistoryEntity)
export class PaymentHistoryRepository extends Repository<PaymentHistoryEntity> {}
