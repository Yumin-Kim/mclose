import { Injectable } from '@nestjs/common';
import { StockItemDto, StockQueryDto } from '../../dto/stock.dto';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { UserEntity } from '../../entities/user.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { STOCK_INITIAL_MARGIN } from '../../constant';
import { RawVideoEntity } from '../../entities/raw-video.entity';
import { StockItemRepository } from '../../repositories/stock-item.repository';
import { QueryRunner } from 'typeorm';
import { PagenationRes } from '../../common/response/response-page';

@Injectable()
export class StockItemService {
  constructor(private readonly stockItemRepository: StockItemRepository) { }

  async create(
    stockItemDto: StockItemDto,
    rawVideo: RawVideoEntity,
    user: UserEntity,
  ) {
    const newEntity = new StockItemEntity();

    // create name YYYYMMDDHHMMSS + 4 random number
    const randomItemName =
      new Date().toISOString().replace(/[^0-9]/g, '') +
      Math.floor(Math.random() * 10000);

    const initPrice = stockItemDto.initialPrice;

    // 20% 범위로 가격 설정
    const lowPrice =
      Number(initPrice) - Number(initPrice) * STOCK_INITIAL_MARGIN;
    const highPrice =
      Number(initPrice) + Number(initPrice) * STOCK_INITIAL_MARGIN;

    newEntity.name = randomItemName;
    newEntity.title = stockItemDto.title;
    newEntity.initialPrice = stockItemDto.initialPrice;
    newEntity.thumbnailUrl = stockItemDto.thumbnailUrl;
    newEntity.thumbnailStartTime = stockItemDto.thumbnailStartTime;
    // ------------------------------------
    newEntity.lowPrice = lowPrice;
    newEntity.highPrice = highPrice;
    newEntity.openPrice = stockItemDto.initialPrice;
    newEntity.closePrice = stockItemDto.initialPrice;
    // ------------------------------------

    newEntity.viewCnt = 0;
    newEntity.matchCnt = 0;
    newEntity.isShow = true;

    newEntity.user = user;
    newEntity.rawVideo = rawVideo;

    return this.stockItemRepository.save(newEntity);
  }

  async list(page: number, limit: number, StockQueryDto: StockQueryDto) {
    let list = [];
    const { keyword, sort_type } = StockQueryDto;

    const query = this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.rawVideo', 'rawVideo')
      .where('stockItem.isShow = true')
      .andWhere('stockItem.isDeleted = false');

    // TODO: title 검색간 공백 제거 , hashTag 검색간 공백 제거
    if (keyword) {
      // whitespace remove to search and database title column remove whitespace
      query.andWhere('stockItem.title like :keyword', {
        keyword: `%${keyword.replace(/\s/g, '')}%`,
      });
    }

    if (sort_type === 'O_AMOUNT_ASC') {
      query.orderBy('stockItem.initialPrice', 'ASC');
    } else if (sort_type === 'O_AMOUNT_DESC') {
      query.orderBy('stockItem.initialPrice', 'DESC');
    } else if (sort_type === 'rand') {
      query.orderBy('rand()');
    } else {
      query.orderBy('stockItem.id', 'DESC');
    }

    const [result, total] = await query
      .skip(page)
      .take(limit)
      .getManyAndCount();

    if (result) {
      list = result.map((item) => {
        return {
          id: item.id,
          name: item.name,
          title: item.title,
          thumbnailUrl: item.thumbnailUrl,
          initialPrice: item.initialPrice,
          openPrice: item.openPrice,
          closePrice: item.closePrice,
          highPrice: item.highPrice,
          lowPrice: item.lowPrice,
          viewCnt: item.viewCnt,
          matchCnt: item.matchCnt,
          thumbnailStartTime: item.thumbnailStartTime,
          rawVideo: {
            id: item.rawVideo.id,
            watermarkVideoUrl: item.rawVideo.watermarkVideoUrl,
          },
        };
      });
    }

    return new PagenationRes(page / limit, limit, total, list);
  }

  async update(stockItem: StockItemEntity, stockItemDto: StockItemDto) {
    stockItem.title = stockItemDto.title;
    if (Number(stockItemDto.thumbnailStartTime) != Number(stockItem.thumbnailStartTime)) {
      if (stockItemDto.thumbnailUrl) {
        stockItem.thumbnailUrl = stockItemDto.thumbnailUrl;
        stockItem.thumbnailStartTime = stockItemDto.thumbnailStartTime;
      }
    }

    return this.stockItemRepository.save(stockItem);
  }

  async delete(stockItem: StockItemEntity) {
    return this.stockItemRepository.update(stockItem.id, {
      isDeleted: true,
      deletedAt: () => 'CURRENT_TIMESTAMP',
      isShow: false,
    });
  }

  async updateIsShow(stockItem: StockItemEntity, isShow: boolean) {
    return this.stockItemRepository.update(stockItem.id, { isShow });
  }

  async increaseViewCnt(stockItem: StockItemEntity) {
    stockItem.viewCnt += 1;
    return this.stockItemRepository.save(stockItem);
  }

  async decreaseViewCnt(stockItem: StockItemEntity) {
    stockItem.viewCnt -= 1;
    return this.stockItemRepository.save(stockItem);
  }

  async increaseMatchCnt(
    stockItemId: number,
    matchCnt: number,
    queryRunner: QueryRunner | null = null,
  ) {
    if (queryRunner) {
      return queryRunner.manager.increment(
        StockItemEntity,
        { id: stockItemId },
        'matchCnt',
        matchCnt,
      );
    }
    return this.stockItemRepository.increment(
      { id: stockItemId },
      'matchCnt',
      matchCnt,
    );
  }

  async isExist(rawVideoId: number) {
    return this.stockItemRepository.findOne({
      where: {
        rawVideo: { id: rawVideoId },
        isDeleted: false,
      },
    });
  }

  async getEntityById(id: number) {
    return this.stockItemRepository.findOne({
      where: { id },
      relations: ['rawVideo', 'user'],
    });
  }
}
