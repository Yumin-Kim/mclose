import { HttpStatus, Injectable } from '@nestjs/common';
import { PagenationRes } from '../../common/response/response-page';
import { SearchUserDto } from '../../dto/admin.dto';
import { Brackets, DataSource, In, Or } from 'typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { PaymentHistoryRepository } from '../../repositories/payment-history.repository';
import { AccountRepository } from '../../repositories/account.repository';
import {
  ACCOUNT_CURRENCY,
  USAGE_HISTORY_TYPE,
} from '../../constant';
import { SupportCustomerRepository } from '../../repositories/support-customer.repository';
import { MarketHistoryRepository } from '../../repositories/market-history.repository';
import { MarketItemRepository } from '../../repositories/market-item.repository';
import { UserMemoRepository } from '../../repositories/user-memo.repository';
import { UserMemoEntity } from '../../entities/user-memo.entity';
import { AdminEntity } from '../../entities/admin.entity';
import { RawVideoRepository } from '../../repositories/raw-video.repository';
import { StockMatchRepository } from '../../repositories/stock-match.repository';
import { MarketItemEntity } from '../../entities/market-item.entity';
import { StockItemEntity } from '../../entities/stock-item.entity';
import { UsageHistoryRepository } from '../../repositories/usage-history.repository';
import { UserEntity } from '../../entities/user.entity';
import { RawVideoEntity } from '../../entities/raw-video.entity';
import { PAYMENT_HISTORY_STATUS } from '../../constant';
@Injectable()
export class AdminUserService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly accountRepository: AccountRepository,
    private readonly paymentHistoryRepository: PaymentHistoryRepository,
    private readonly supportCustomerRepository: SupportCustomerRepository,
    private readonly marketHistoryRepository: MarketHistoryRepository,
    private readonly marketItemRepository: MarketItemRepository,
    private readonly userMemoRepository: UserMemoRepository,
    private readonly rawVideoRepository: RawVideoRepository,
    private readonly stockMatchRepository: StockMatchRepository,
    private readonly usageHistoryRepository: UsageHistoryRepository,
  ) { }

  /**
   * 관리자 페이지 - 고객 리스트 조회
   * @param page
   * @param limit
   * @param searchUserDto
   * @returns
   */
  async list(page: number, limit: number, searchUserDto: SearchUserDto) {
    let list = [];
    let whereCond = 'WHERE 1=1';
    const whereCondArr = [];
    const { real_name, phone_no, login_id } = searchUserDto;

    if (real_name) {
      whereCond += ` AND U.real_name LIKE ?`;
      whereCondArr.push(`%${real_name}%`);
    }
    if (phone_no) {
      whereCond += ` AND U.phone_no LIKE ?`;
      whereCondArr.push(`%${phone_no}%`);
    }
    if (login_id) {
      whereCond += ` AND U.login_id LIKE ?`;
      whereCondArr.push(`%${login_id}%`);
    }

    const userListQuery = `
  SELECT
    U.id,
    U.login_id,
    U.phone_no,
    U.real_name,
    IFNULL(ACL.balance, 0) AS market_balance,
    IFNULL(AOS.balance, 0) AS stock_balance
  FROM
    mc_user U
    LEFT JOIN mc_account ACL ON (
      U.id = ACL.user_id
      AND ACL.currency = 'CL'
    )
    LEFT JOIN mc_account AOS ON (
      U.id = AOS.user_id
      AND AOS.currency = 'OS'
    )
    ${whereCond}
    ORDER BY U.id DESC
    LIMIT ${page} , ${limit}`;

    const totalQuery = `
  SELECT
    COUNT(*) AS total
  FROM
    mc_user U
  ${whereCond}
  ORDER BY U.id DESC`;

    list = await this.dataSource.query(userListQuery, whereCondArr);
    const totalResult = await this.dataSource.query(totalQuery, whereCondArr);

    if (list.length > 0) {
      // 생성 완료한 동영상
      const rawVideoCountQuery = `
    SELECT
      COUNT(*) AS total,
      user_id
    FROM
      mc_raw_video
    WHERE
      user_id IN (${list.map((item) => item.id).join(',')})
    GROUP BY user_id`;

      // 영상 마켓 등록한 동영상
      const marketItemCountQuery = `
    SELECT
      COUNT(*) AS total,
      user_id
    FROM
      mc_market_item
    WHERE
      user_id IN (${list.map((item) => item.id).join(',')})
    GROUP BY user_id`;

      // 고객 문의 내역 수
      const supportCustomerCountQuery = `
    SELECT
      COUNT(*) AS total,
      user_id
    FROM
      mc_support_customer
    WHERE
      user_id IN (${list.map((item) => item.id).join(',')})
    GROUP BY user_id`;

      const rawVideoCountList = await this.dataSource.query(rawVideoCountQuery);
      const marketItemCountList =
        await this.dataSource.query(marketItemCountQuery);
      const supportCustomerCountList = await this.dataSource.query(
        supportCustomerCountQuery,
      );

      list = list.map((item) => {
        const rawVideo = rawVideoCountList.find(
          (count) => count.user_id === item.id,
        );

        const supportCustomer = supportCustomerCountList.find(
          (count) => count.user_id === item.id,
        );

        const marketItem = marketItemCountList.find(
          (count) => count.user_id === item.id,
        );

        return {
          id: item.id,
          loginId: item.login_id,
          realName: item.real_name,
          phoneNo: item.phone_no,
          marketBalance: item.market_balance,
          stockBalance: item.stock_balance,
          rawVideoCount: rawVideo ? rawVideo.total : 0,
          supportCustomerCount: supportCustomer ? supportCustomer.total : 0,
          marketItemCount: marketItem ? marketItem.total : 0,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalResult[0].total, list);
  }

  /**
   * 관리자 페이지 - 고객 정보 상세 조회
   * @param id
   * @returns
   */
  async getDefaultDetail(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      return null;
    }

    const marketAccount = await this.accountRepository.findOne({
      where: { user, currency: ACCOUNT_CURRENCY.CL },
    });
    const stockAccount = await this.accountRepository.findOne({
      where: { user, currency: ACCOUNT_CURRENCY.OS },
    });

    return {
      id: user.id,
      realName: user.realName,
      loginId: user.loginId,
      phoneNo: user.phoneNo,
      bankCode: user.bankCode,
      bankAccountNumber: user.bankAccountNumber,
      bankName: user.bankName,
      isConsentUse: user.isConsentUsed,
      isConsentMarketingInfo: user.isConsentMarketingInfo,
      isConsentPersonalInfo: user.isConsentPersonalInfo,
      marketBalance: marketAccount ? marketAccount.balance : 0,
      stockBalance: stockAccount ? stockAccount.balance : 0,
      createdAt: user.createdAt,
      lastActivitedAt: user.lastActivitedAt,
    };
  }

  /**
   * 관리자 페이지 - 고객 정보 상세 조회 - 제작 동영상
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getRawVideoList(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.rawVideoRepository.findAndCount({
      where: { user: { id } },
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 고객 정보 상세 조회 - 보유 상품 - 구매 내역 조회
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getPurchaseMarketHistoryList(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.marketHistoryRepository.findAndCount({
      relations: ['marketItem'],
      where: { buyUser: { id } },
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 고객 정보 상세 조회 - 보유 상품 (동영상 상품)
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getRegisteredMarketList(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.marketItemRepository.findAndCount({
      where: { user: { id } },
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 고객 정보 상세 조회 - 보유 상품 (판매 내역 조회)
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getMatchingHistory(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.stockMatchRepository.findAndCount({
      relations: ['stockItem', 'buyUser', 'sellUser'],
      where: [{ buyUser: { id } }, { sellUser: { id } }],
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 관리자 페이지 - 고객 정보 상세 조회 - 거래 내역 조회
   * @param id 
   * @param page 
   * @param limit 
   * @returns 
   */
  async getUsageHistoryList(id: number, page: number, limit: number) {
    let list = [];

    // const totalQuery =
    //   this.usageHistoryRepository.createQueryBuilder('usageHistory')
    //     .where('usageHistory.type != :type', { type: USAGE_HISTORY_TYPE.PROMPT })
    //     .andWhere(
    //       new Brackets(qb => {
    //         qb.where('user.id = :userId', { userId: id })
    //           .orWhere('marketItemSeller.id = :userId', { userId: id })
    //           .orWhere('stockItemSeller.id = :userId', { userId: id });
    //       }),
    //     );

    const query = this.usageHistoryRepository
      .createQueryBuilder('usageHistory')
      .leftJoinAndMapOne(
        'usageHistory.marketItem',
        MarketItemEntity,
        'marketItem',
        'usageHistory.type = :usageTypeToMarket AND usageHistory.refId = marketItem.id',
        { usageTypeToMarket: USAGE_HISTORY_TYPE.MARKET },
      )
      .leftJoinAndMapOne(
        'usageHistory.marketItem.user',
        UserEntity,
        'marketItemSeller',
        'marketItem.user.id = marketItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.stockItem',
        StockItemEntity,
        'stockItem',
        'usageHistory.type = :usageTypeToStock AND usageHistory.refId = stockItem.id',
        { usageTypeToStock: USAGE_HISTORY_TYPE.STOCK_MATCH_BUY },
      )
      // stockItem.user 접근
      .leftJoinAndMapOne(
        'usageHistory.stockItem.user',
        UserEntity,
        'stockItemSeller',
        'stockItem.user.id = stockItemSeller.id',
      )
      .leftJoinAndMapOne(
        'usageHistory.user',
        UserEntity,
        'user',
        'user.id = usageHistory.user_id',
      );


    // 판매 내역 조회
    query
      .where('usageHistory.type != :type', { type: USAGE_HISTORY_TYPE.PROMPT })
      .andWhere(
        new Brackets(qb => {
          qb.where('user.id = :userId', { userId: id })
            .orWhere('marketItemSeller.id = :userId', { userId: id })
            .orWhere('stockItemSeller.id = :userId', { userId: id });
        }),
      );


    const totalCount = await query.getCount();

    query
      .offset(page)
      .limit(limit)
      .orderBy('usageHistory.id', 'DESC')
      .select([
        'usageHistory.id',
        'usageHistory.type',
        'usageHistory.amount',
        'usageHistory.currency',
        'usageHistory.createdAt',
        'COALESCE(marketItem.id, stockItem.id) as item_id',
        'COALESCE(marketItem.title, stockItem.title) as title',
        'COALESCE(marketItem.name, stockItem.name) as name',
        'COALESCE(marketItem.viewCnt, stockItem.viewCnt) as view_cnt',
        'COALESCE(marketItem.purchaseCnt, stockItem.matchCnt) as match_cnt',
        `CASE 
            WHEN user.id = :userId THEN 'BUY' 
            WHEN marketItemSeller.id = :userId OR stockItemSeller.id = :userId THEN 'SELL' 
         END as status`,
      ]);

    const entityList = await query.getRawMany();


    if (entityList.length > 0) {
      list = entityList.map((entity) => {
        return {
          id: entity.usageHistory_id,
          type: entity.usageHistory_type,
          amount: entity.usageHistory_amount,
          currency: entity.usageHistory_currency,
          createdAt: entity.usageHistory_created_at,
          itemId: entity.item_id,
          title: entity.title,
          name: entity.name,
          viewCnt: entity.view_cnt,
          matchCnt: entity.match_cnt,
          status: entity.status
        };
      });
    }
    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  /**
   * 관리자 페이지 - 고객 정보 상세 조회 - 입출금 정보
   * TODO: 정산 완료시 payment에 기록 남겨야함
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getPaymentHistoryList(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.paymentHistoryRepository.findAndCount(
      {
        where: { user: { id }, status: In([PAYMENT_HISTORY_STATUS.PAID, PAYMENT_HISTORY_STATUS.OUTFLOW]) },
        order: { id: 'DESC' },
        take: limit,
        skip: page,
      },
    );

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 고객 정보 상세 조회 - 고객 문의 내역 조회
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getSupportCustomerList(id: number, page: number, limit: number) {
    const supportCustomerList = await this.supportCustomerRepository.find({
      where: { user: { id } },
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    const count = await this.supportCustomerRepository.count({
      where: { user: { id } },
    });

    return new PagenationRes(page, limit, count, supportCustomerList);
  }

  /**
   * 고객 정보 상세 조회 - 고객 메모 조회
   * @param id
   * @param page
   * @param limit
   * @returns
   */
  async getMemoList(id: number, page: number, limit: number) {
    const [list, totalCount] = await this.userMemoRepository.findAndCount({
      relations: ['admin'],
      where: { user: { id } },
      order: { id: 'DESC' },
      take: limit,
      skip: page,
    });

    return new PagenationRes(page, limit, totalCount, list);
  }

  /**
   * 고객 정보 상세 조회 - 고객 메모 생성
   * @param id
   * @param memo
   * @param admin
   * @returns
   */
  async createMemo(id: number, memo: string, admin: AdminEntity) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return false;
    }

    const newEntity = new UserMemoEntity();
    newEntity.user = user;
    newEntity.content = memo;
    newEntity.admin = admin;

    await this.userMemoRepository.save(newEntity);

    return true;
  }

  /**
   * 고객 정보 상세 조회 - 고객 메모 삭제
   * @param id
   * @returns
   */
  async deleteMemo(id: number) {
    const userMemo = await this.userMemoRepository.findOne({
      where: { id },
    });

    if (!userMemo) {
      return false;
    }

    await this.userMemoRepository.delete(id);

    return true;
  }
}
