import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { UsageHistoryEntity } from '../entities/usage-history.entity';
import { MarketProfitPayoutHistoryEntity } from '../entities/market-profit-payout-history.entity';

@CustomRepository(MarketProfitPayoutHistoryEntity)
export class MarketProfitPayoutHistoryRespository extends Repository<MarketProfitPayoutHistoryEntity> { }
