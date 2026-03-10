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
import { SupportFaqRepository } from '../../repositories/support-faq.repository';
import { FaqDto, SearchSupportDto } from '../../dto/admin.dto';
import { AdminEntity } from '../../entities/admin.entity';
import { SupportFaqEntity } from '../../entities/support-faq.entity';
import { CommonService } from '../common.service';
import { SupportBussinessRepository } from '../../repositories/support-business.repository';
import { SUPPORT_STATUS } from '../../constant';
@Injectable()
export class AdminSupportService {
  private readonly logger = new Logger(AdminSupportService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly supportCustomerRepository: SupportCustomerRepository,
    private readonly supportFaqRepository: SupportFaqRepository,
    private readonly supportBussinessRepository: SupportBussinessRepository,
    private readonly commonService: CommonService,
  ) { }

  /**
   * 고갹 문의 리스트 조회
   * @param page
   * @param limit
   * @param searchSupportDto
   * @returns
   */
  async getSupportCustomerList(
    page,
    limit,
    searchSupportDto: SearchSupportDto,
  ) {
    const whereCondition = {};
    const dateFrom = this.commonService.startOfDay(searchSupportDto.date_from);
    const dateTo = this.commonService.endOfDay(searchSupportDto.date_to);

    if (searchSupportDto) {
      if (searchSupportDto.real_name) {
        // Like 검색
        whereCondition['realName'] = Like(`%${searchSupportDto.real_name}%`);
      }
      if (searchSupportDto.login_id) {
        // Like 검색
        whereCondition['loginId'] = Like(`%${searchSupportDto.login_id}%`);
      }
      if (searchSupportDto.date_from && searchSupportDto.date_to) {
        // Between 검색
        whereCondition['createdAt'] = Between(dateFrom, dateTo);
      }

      if (searchSupportDto.status != 'ALL') {
        whereCondition['status'] = searchSupportDto.status;
      }
    }

    const [supportCustomerList, total] =
      await this.supportCustomerRepository.findAndCount({
        where: whereCondition,
        take: limit,
        skip: page,
        order: {
          id: 'DESC',
        },
      });

    return new PagenationRes(page, limit, total, supportCustomerList);
  }

  /**
   * 고객 문의 상세 조회
   * @param supportId
   * @returns
   */
  async getSupportCustomerDetail(supportId) {
    return this.supportCustomerRepository.findOne({
      relations: ['user'],
      where: {
        id: supportId,
      },
    });
  }

  /**
   * 고객 문의 답변 생성
   * @param supportId 
   * @param response 
   * @returns 
   */
  async createResponseCustomerSupport(supportId, response) {
    const support = await this.supportCustomerRepository.findOne({
      where: {
        id: supportId,
      },
    });

    if (!support) {
      return null;
    }

    support.responseContent = response;
    support.status = SUPPORT_STATUS.CONFIRMED;

    return this.supportCustomerRepository.save(support);
  }

  /**
   * 고객 문의글 상태 변경
   * @param supportId 
   * @param status 
   * @returns 
   */
  async updateStatusCustomerSupport(supportId, status) {
    const support = await this.supportCustomerRepository.findOne({
      where: {
        id: supportId,
      },
    });

    if (!support) {
      return null;
    }

    support.status = status;
    return await this.supportCustomerRepository.save(support);
  }

  /**
   * 기업 문의 리스트 조회
   * @param page
   * @param limit
   * @param searchSupportDto
   * @returns
   */
  async getSupportBusinessList(
    page,
    limit,
    searchSupportDto: SearchSupportDto,
  ) {
    const whereCondition = {};
    const dateFrom = this.commonService.startOfDay(searchSupportDto.date_from);
    const dateTo = this.commonService.endOfDay(searchSupportDto.date_to);

    if (searchSupportDto) {
      if (searchSupportDto.real_name) {
        // Like 검색
        whereCondition['realName'] = Like(`%${searchSupportDto.real_name}%`);
      }
      if (searchSupportDto.login_id) {
        // Like 검색
        whereCondition['loginId'] = Like(`%${searchSupportDto.login_id}%`);
      }
      if (searchSupportDto.date_from && searchSupportDto.date_to) {
        // Between 검색
        whereCondition['createdAt'] = Between(dateFrom, dateTo);
      }
      if (searchSupportDto.status != 'ALL') {
        whereCondition['status'] = searchSupportDto.status;
      }
    }

    const [supportCustomerList, total] =
      await this.supportBussinessRepository.findAndCount({
        where: whereCondition,
        take: limit,
        skip: page,
        order: {
          id: 'DESC',
        },
      });

    return new PagenationRes(page, limit, total, supportCustomerList);
  }

  /**
   * 기업 문의 상세 조회
   * @param supportId
   * @returns
   */
  async getSupportBusinessDetail(supportId) {
    return this.supportBussinessRepository.findOne({
      where: {
        id: supportId,
      },
    });
  }

  /**
   * 기업 문의글 상태 변경
   * @param supportId 
   * @param status 
   * @returns 
   */
  async updateStatusBusinessSupport(supportId, status) {
    const support = await this.supportBussinessRepository.findOne({
      where: {
        id: supportId,
      },
    });

    if (!support) {
      return null;
    }

    support.status = status;
    return await this.supportBussinessRepository.save(support);
  }

  /**
   * 고객 FAQ 리스트 조회
   * @param page
   * @param limit
   * @returns
   */
  async getFaqList(page, limit) {
    const [faqList, total] = await this.supportFaqRepository.findAndCount({
      relations: ['admin'],
      take: limit,
      skip: page,
      order: {
        id: 'DESC',
      },
    });

    return new PagenationRes(page, limit, total, faqList);
  }

  /**
   * 고객 FAQ 상세 조회
   * @param faqId
   * @returns
   */
  async getFaqDetail(faqId) {
    return this.supportFaqRepository.findOne({
      where: {
        id: faqId,
      },
    });
  }

  /**
   * 고객 FAQ 생성
   * @param faqDto
   * @param admin
   * @returns
   */
  async createFaq(faqDto: FaqDto, admin: AdminEntity) {
    const newEntity = new SupportFaqEntity();
    newEntity.title = faqDto.title;
    newEntity.content = faqDto.content;

    newEntity.admin = admin;

    return this.supportFaqRepository.save(newEntity);
  }

  /**
   * 고객 FAQ 업데이트
   * @param faqDto
   * @param admin
   * @returns
   */
  async updateFaq(faqId, faqDto: FaqDto, admin: AdminEntity) {
    const faq = await this.supportFaqRepository.findOne({
      where: {
        id: faqId,
      },
    });
    if (!faq) {
      return null;
    }

    faq.title = faqDto.title;
    faq.content = faqDto.content;

    faq.admin = admin;

    return this.supportFaqRepository.save(faq);
  }

  /**
   * 고객 FAQ 삭제
   * @param faqId
   * @returns
   */
  async deleteFaq(faqDto: FaqDto) {
    // bulk delete
    const idList = faqDto.idList;

    if (!idList || idList.length == 0) {
      return null;
    }

    return this.supportFaqRepository.delete(idList);
  }
}
