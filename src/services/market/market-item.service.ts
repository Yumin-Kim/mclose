import { Injectable } from '@nestjs/common';
import { MarketItemRepository } from '../../repositories/market-item.repository';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { UserEntity } from '../../entities/user.entity';
import { RawVideoEntity } from '../../entities/raw-video.entity';
import { UserService } from '../user.service';
import { VideoActionService } from '../video/video-action.service';
import { MarketDto, MarketQueryDto } from '../../dto/market.dto';
import { PagenationRes } from '../../common/response/response-page';

@Injectable()
export class MarketItemService {
  constructor(
    private readonly marketItemRepository: MarketItemRepository,
    private readonly userService: UserService,
    private readonly videoService: VideoActionService,
  ) { }

  async list(page: number, limit: number, marketQueryDto: MarketQueryDto) {
    let list = [];
    const { keyword, keyword_type, sort_type, ratio, resolution } =
      marketQueryDto;

    const query = this.marketItemRepository
      .createQueryBuilder('marketItem')
      .leftJoinAndSelect('marketItem.user', 'user')
      .leftJoinAndSelect('marketItem.rawVideo', 'rawVideo')
      .where('marketItem.isShow = :isShow', { isShow: true })
      .andWhere('marketItem.isDeleted = :isDeleted', { isDeleted: false });

    // // user is not null
    // if (user) {
    //   // isLike
    //   query.addSelect((subQuery) => {
    //     return subQuery
    //       .select('COUNT(*)')
    //       .from('mc_market_like', 'marketLike')
    //       .where('marketLike.user_id = :userId', { userId: user.id })
    //       .andWhere('marketLike.market_item_id = marketItem.id');
    //   }, 'isLike');
    // }

    // TODO: title 검색간 공백 제거 , hashTag 검색간 공백 제거
    if (keyword) {
      if (keyword_type === 'title') {
        query.andWhere('marketItem.title like :keyword', {
          keyword: `%${keyword}%`,
        });
      } else if (keyword_type === 'hashTag') {
        query.andWhere('marketItem.hashTag like :keyword', {
          keyword: `%${keyword}%`,
        });
      }
    }

    if (ratio) {
      query.andWhere('rawVideo.videoRatio = :ratio', { ratio });
    }

    // K_TODO: 2024.11.05 임시 수정
    // 현재 젖아된 resolution -> 1000x1000
    // if (resolution) {
    //   query.andWhere('rawVideo.videoResolution = :resolution', { resolution });
    // }
    if (resolution) {
      query.andWhere('rawVideo.videoResolution like :resolution', {
        resolution: `%${resolution}%`,
      });
    }

    if (sort_type === 'rand') {
      query.orderBy('rand()');
    } else {
      query.orderBy('marketItem.id', 'DESC');
    }

    const [result, total] = await query
      .skip(page)
      .take(limit)
      .getManyAndCount();

    if (result.length > 0) {
      list = await result.map((item) => {
        return {
          id: item.id,
          title: item.title,
          price: item.price,
          thumbnailUrl: item.thumbnailUrl,
          watermarkVideoUrl: item.rawVideo.watermarkVideoUrl,
          hashTag: item.hashTag,
          likeCnt: item.likeCnt,
          viewCnt: item.viewCnt,
          purchaseCnt: item.purchaseCnt,
          thumbnailStartTime: item.thumbnailStartTime,
          user: {
            id: item.user.id,
            realName: item.user.realName,
          },
          rawVideo: {
            id: item.rawVideo.id,
            ratio: item.rawVideo.videoRatio,
            resolution: item.rawVideo.videoResolution,
          },
        };
      });
    }

    return new PagenationRes(page / limit, limit, total, list);
  }

  // market Item 생성
  async create(data: MarketDto, rawVideo: RawVideoEntity, user: UserEntity) {
    const newEntity = new MarketItemEntity();

    // create name YYYYMMDDHHMMSS + 4 random number
    const randomItemName =
      new Date().toISOString().replace(/[^0-9]/g, '') +
      Math.floor(Math.random() * 10000);

    newEntity.name = randomItemName;
    newEntity.title = data.title;
    newEntity.price = data.price;
    newEntity.hashTag = data.hashTag;
    newEntity.likeCnt = 0;
    newEntity.viewCnt = 0;
    newEntity.purchaseCnt = 0;
    newEntity.thumbnailUrl = data.thumbnailUrl;
    newEntity.thumbnailStartTime = data.thumbnailStartTime;

    newEntity.user = user;
    newEntity.rawVideo = rawVideo;

    return this.marketItemRepository.save(newEntity);
  }

  async update(data: MarketDto, marketItemEntity: MarketItemEntity) {
    marketItemEntity.title = data.title;
    marketItemEntity.price = data.price;
    marketItemEntity.hashTag = data.hashTag;
    if (Number(marketItemEntity.thumbnailStartTime) !== Number(data.thumbnailStartTime)) {
      if (data.thumbnailUrl) {
        marketItemEntity.thumbnailUrl = data.thumbnailUrl;
        marketItemEntity.thumbnailStartTime = data.thumbnailStartTime;
      }
    }

    return this.marketItemRepository.save(marketItemEntity);
  }

  async delete(marketItemEntity: MarketItemEntity) {
    return this.marketItemRepository.update(marketItemEntity.id, {
      isDeleted: true,
      isShow: false,
      deletedAt: () => 'CURRENT_TIMESTAMP',
    });
  }

  async updateIsShow(marketItemEntity: MarketItemEntity, isShow: boolean) {
    return this.marketItemRepository.update(marketItemEntity.id, {
      isShow,
    });
  }

  async isExist(rawVideoId: number) {
    return this.marketItemRepository.findOne({
      where: {
        rawVideo: { id: rawVideoId },
        isDeleted: false,
      },
    });
  }
  // market item 조회
  async getEntityById(id: number, isAdmin: boolean = false) {
    let relations = ['user', 'rawVideo'];

    if (isAdmin) {
      relations = ['user', 'rawVideo'];
    }

    return this.marketItemRepository.findOne({
      relations,
      where: { id },
    });
  }

  async getEntityByRawVideoId(id: number) {
    return await this.marketItemRepository.findOne({
      relations: ['user', 'rawVideo'],
      where: { rawVideo: { id } },
    });
  }
}
