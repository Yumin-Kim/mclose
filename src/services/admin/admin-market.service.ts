import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PagenationRes } from '../../common/response/response-page';
import { Between, DataSource, Like, MoreThan } from 'typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { PaymentHistoryRepository } from '../../repositories/payment-history.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { SupportCustomerRepository } from '../../repositories/support-customer.repository';
import { MarketHistoryRepository } from '../../repositories/market-history.repository';
import { MarketItemRepository } from '../../repositories/market-item.repository';
import { UserMemoRepository } from '../../repositories/user-memo.repository';
import { SearchMarketDto } from '../../dto/admin.dto';
import { CommonService } from '../common.service';
import { AwsSesService } from '../../common/aws/ses/aws-ses.service';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { StockOrderLiveEntity } from '../../entities/stock-order-live.entity';
import { StockOrderEntity } from '../../entities/stock-order.entity';
@Injectable()
export class AdminMarketService {
  private readonly logger = new Logger(AdminMarketService.name);
  private readonly fromEmail: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly marketHistoryRepository: MarketHistoryRepository,
    private readonly marketItemRepository: MarketItemRepository,
    private readonly commonService: CommonService,
  ) {}

  /**
   * 영상 등록 상품 조회
   * @param page
   * @param limit
   * @param searchMarketDto
   * @returns
   */
  async list(page: number, limit: number, searchMarketDto: SearchMarketDto) {
    const { real_name, title, login_id, date_from, date_to } = searchMarketDto;
    const whereCondition = {};
    const dateFrom = this.commonService.startOfDay(date_from);
    const dateTo = this.commonService.endOfDay(date_to);

    if (real_name) {
      whereCondition['user.real_name'] = Like(`%${real_name} % `);
    }

    if (title) {
      whereCondition['title'] = Like(`% ${title}% `);
    }

    if (login_id) {
      whereCondition['user.login_id'] = Like(`% ${login_id}% `);
    }

    if (date_from && date_to) {
      whereCondition['createdAt'] = Between(dateFrom, dateTo);
    }

    const [marketList, total] = await this.marketItemRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'rawVideo'],
      order: {
        id: 'DESC',
      },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, total, marketList);
  }

  /**
   * 영상 등록 상품 상세 조회
   * @param id
   * @returns
   */
  async getDetail(id: number) {
    const marketItem = await this.marketItemRepository.findOne({
      where: {
        id,
      },
      relations: ['user', 'rawVideo'],
    });

    return marketItem;
  }

  /**
   * 영상 / 지분 상품 상태 변경
   * @param id
   * @param isShow
   * @param issueComment
   * @returns
   */
  async updateShowStatus(id: number, isShow: boolean, issueComment: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let isSuccessful = true;
    let isSendEmail = false;
    let isDeleteStockOrder = false;
    try {
      // marketItem 검증
      const marketItem = await queryRunner.manager.findOne(MarketItemEntity, {
        relations: ['rawVideo'],
        where: {
          id,
          isDeleted: false,
          isShow: true,
        },
      });
      if (!marketItem) {
        throw new Error('marketItem is not found');
      }

      // stockItem 검증
      const stockItem = await queryRunner.manager.findOne(StockItemEntity, {
        where: {
          rawVideo: {
            id: marketItem.rawVideo.id,
          },
        },
      });

      await queryRunner.manager.update(
        MarketItemEntity,
        {
          id,
        },
        {
          isShow,
          issueComment,
        },
      );

      if (stockItem) {
        await queryRunner.manager.update(
          StockItemEntity,
          {
            id: stockItem.id,
          },
          {
            isShow,
            issueComment,
          },
        );

        const stockOrder = await queryRunner.manager.findOne(StockOrderEntity, {
          where: {
            stockItem: {
              id: stockItem.id,
            },
            volume: MoreThan(0),
          },
        });
        if (stockOrder) {
          isDeleteStockOrder = true;
        }
      }

      await queryRunner.commitTransaction();
      isSuccessful = true;
      isSendEmail = true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return {
        isSuccessful,
        isSendEmail,
        isDeleteStockOrder,
      };
    }
  }

  // 미노출 => 노출 경우
  // 삭제한 경우 제외
  async rollbackShowStatus(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    let isSuccessful = true;

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // marketItem 검증
      const marketItem = await queryRunner.manager.findOne(MarketItemEntity, {
        relations: ['rawVideo'],
        where: {
          id,
          isDeleted: false,
          isShow: false,
        },
      });
      if (!marketItem) {
        throw new Error('marketItem is not found');
      }

      // stockItem 검증
      const stockItem = await queryRunner.manager.findOne(StockItemEntity, {
        where: {
          rawVideo: {
            id: marketItem.rawVideo.id,
          },
        },
      });
      if (!stockItem) {
        throw new Error('stockItem is not found');
      }
      if (stockItem.isDeleted) {
        throw new Error('stockItem is deleted');
      }
      if (stockItem.isShow) {
        throw new Error('stockItem is already show');
      }

      await queryRunner.manager.update(
        MarketItemEntity,
        {
          id,
        },
        {
          isShow: true,
          issueComment: null,
        },
      );

      if (stockItem) {
        await queryRunner.manager.update(
          StockItemEntity,
          {
            id: stockItem.id,
          },
          {
            isShow: true,
            issueComment: null,
          },
        );
      }

      await queryRunner.commitTransaction();
      isSuccessful = true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      return {
        isSuccessful,
      };
    }
  }

  async updateDeleteStatus(id: number, isDelete: boolean) {
    const marketItem = await this.marketItemRepository.findOne({
      where: {
        id,
      },
    });

    if (!marketItem) {
      return false;
    }

    marketItem.isDeleted = isDelete;
    await this.marketItemRepository.save(marketItem);
  }

  async salesList(
    page: number,
    limit: number,
    searchMarketDto: SearchMarketDto,
  ) {
    const { real_name, title, login_id, date_from, date_to } = searchMarketDto;
    const whereCondition = {};

    if (real_name) {
      whereCondition['user.real_name'] = Like(`% ${real_name}% `);
    }

    if (title) {
      whereCondition['title'] = Like(`% ${title}% `);
    }

    if (login_id) {
      whereCondition['user.login_id'] = Like(`% ${login_id}% `);
    }

    if (date_from && date_to) {
      whereCondition['createdAt'] = {
        $between: [date_from, date_to],
      };
    }

    const [marketList, total] = await this.marketHistoryRepository.findAndCount(
      {
        where: whereCondition,
        relations: ['user', 'marketItem'],
        order: {
          id: 'DESC',
        },
        take: limit,
        skip: page,
      },
    );

    return new PagenationRes(page, limit, total, marketList);
  }

  async getEnttityById(id: number) {
    return await this.marketItemRepository.findOne({
      relations: ['user', 'rawVideo'],
      where: {
        id,
      },
    });
  }
}
