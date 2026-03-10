import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PagenationRes } from '../../common/response/response-page';
import { Between, DataSource, Like } from 'typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { PaymentHistoryRepository } from '../../repositories/payment-history.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { SupportCustomerRepository } from '../../repositories/support-customer.repository';
import { MarketHistoryRepository } from '../../repositories/market-history.repository';
import { MarketItemRepository } from '../../repositories/market-item.repository';
import { UserMemoRepository } from '../../repositories/user-memo.repository';
import { SearchStockDto } from '../../dto/admin.dto';
import { CommonService } from '../common.service';
import { StockItemRepository } from '../../repositories/stock-item.repository';
import { StockAccountRepository } from '../../repositories/stock-account.repository';
import { StockOrderLiveEntity } from '../../entities/stock-order-live.entity';
import { StockOrderLiveRepository } from '../../repositories/stock-order-live.repository';
import { STOCK_ORDER_STATUS } from '../../constant';
@Injectable()
export class AdminStockService {
  private readonly logger = new Logger(AdminStockService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly stockItemRepository: StockItemRepository,
    private readonly stockAccountRepository: StockAccountRepository,
    private readonly stockOrderLiveRepository: StockOrderLiveRepository,
    private readonly commonService: CommonService,
  ) { }

  /**
   * 지분 상품 조회
   * @param page
   * @param limit
   * @param searchStockDto
   * @returns
   */
  async list(page: number, limit: number, searchStockDto: SearchStockDto) {
    const { real_name, title, login_id, date_from, date_to } = searchStockDto;
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

    const [marketList, total] = await this.stockItemRepository.findAndCount({
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
   * 지분 상품 상세 조회
   * @param id
   * @returns
   */
  async getDetail(id: number) {
    const stockItem = await this.stockItemRepository.findOne({
      relations: ['user', 'rawVideo'],
      where: {
        id,
      },
    });

    const stockAccount = await this.stockAccountRepository.findOne({
      where: {
        stockItem: {
          id,
        },
        user: {
          id: stockItem.user.id,
        },
      },
    });

    return {
      stockItem,
      stockAccount,
      rawVideo: stockItem.rawVideo,
    };
  }

  async updateShowStatus(id: number, isShow: boolean) {
    const stockItem = await this.stockItemRepository.findOne({
      where: {
        id,
      },
    });

    if (!stockItem) {
      return false;
    }

    stockItem.isShow = isShow;
    await this.stockItemRepository.save(stockItem);
    return true;
  }

  async updateDeleteStatus(id: number, isDelete: boolean) {
    const stockItem = await this.stockItemRepository.findOne({
      where: {
        id,
      },
    });

    if (!stockItem) {
      return false;
    }

    stockItem.isDeleted = isDelete;
    await this.stockItemRepository.save(stockItem);
    return true;
  }

  async getEntityByRawVideoId(rawVideoId: number) {
    return await this.stockItemRepository.findOne({
      where: {
        rawVideo: {
          id: rawVideoId,
        },
      },
    });
  }

  async getHideStockOrderLive(id: number) {
    return await this.stockOrderLiveRepository.
      createQueryBuilder('stockOrderLive')
      .leftJoinAndSelect('stockOrderLive.user', 'user')
      .leftJoinAndSelect('stockOrderLive.stockItem', 'stockItem')
      .where('stockOrderLive.stockItemId = :id', { id })
      .andWhere('stockOrderLive.isDeleted = :isDeleted', { isDeleted: true })
      .andWhere('stockOrderLive.status = :status', { status: STOCK_ORDER_STATUS.HIDE })
      .groupBy('user.id')
      .getMany();
  }
}
