import { Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { MarketItemEntity } from '../entities/market-item.entity';
import { getWhere } from '../common/database/typeorm-util';

@CustomRepository(MarketItemEntity)
export class MarketItemRepository extends Repository<MarketItemEntity> {
  async findAll(marketSearchDto: any, page: number, limit: number, isAdmin) {
    let whereObj = {};
    if (!isAdmin) {
      whereObj = {
        isShow: true,
      };
    }

    if (marketSearchDto) {
      Object.keys(marketSearchDto).forEach((key) => {
        const obj = getWhere(key, marketSearchDto[key]);
        if (
          [
            'videoResolution',
            'videoDuration',
            'videoFormat',
            'videoRatio',
          ].includes(key)
        ) {
          whereObj['rawVideo'] = {
            ...whereObj['rawVideo'],
            ...obj,
          };
        } else if (['realName']) {
          whereObj['user'] = {
            ...whereObj['user'],
            ...obj,
          };
        } else {
          whereObj = {
            ...whereObj,
            ...obj,
          };
        }
      });
    }

    return this.find({
      where: whereObj,
      relations: ['user', 'rawVideo'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
