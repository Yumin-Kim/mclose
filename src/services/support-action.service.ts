import { Injectable } from '@nestjs/common';
import { SupportFaqRepository } from '../repositories/support-faq.repository';
import { SupportCustomerRepository } from '../repositories/support-customer.repository';
import { SupportBussinessRepository } from '../repositories/support-business.repository';
import { PagenationRes } from '../common/response/response-page';
import { SupportBussinessDto, SupportCustomerDto } from '../dto/support.dto';
import { UserEntity } from '../entities/user.entity';
import { SupportCustomerEntity } from '../entities/support-customer.entity';
import { SupportBussinessEntity } from '../entities/support-bussiness.entity';
import { AdminRepository } from '../repositories/admin.repository';
import { In } from 'typeorm';
import { ADMIN_ROLE } from '../constant';

@Injectable()
export class SupportActionService {
  constructor(
    private readonly supportFaqRepository: SupportFaqRepository,
    private readonly supportCustomerRepository: SupportCustomerRepository,
    private readonly supportBussinessRepository: SupportBussinessRepository,
    private readonly adminRepository: AdminRepository,
  ) {}

  async getFapList(page: number, limit: number) {
    let list = [];

    const [enttityList, totalCount] =
      await this.supportFaqRepository.findAndCount({
        take: limit,
        skip: page,
      });

    if (enttityList.length > 0) {
      list = enttityList.map((entity) => {
        return {
          id: entity.id,
          title: entity.title,
          content: entity.content,
        };
      });
    }

    return new PagenationRes(page / limit, limit, totalCount, list);
  }

  async createCustomerSupport(
    data: SupportCustomerDto,
    user: UserEntity | null,
  ) {
    const newEntity = new SupportCustomerEntity();

    newEntity.realName = data.realName;
    newEntity.phoneNo = data.phoneNo;
    newEntity.email = data.email;
    newEntity.type = data.type;
    newEntity.content = data.content;

    if (user) {
      newEntity.user = user;
    }

    return await this.supportCustomerRepository.save(newEntity);
  }

  async createBussinessSupport(
    data: SupportBussinessDto,
    user: UserEntity | null,
  ) {
    const newEntity = new SupportBussinessEntity();

    newEntity.realName = data.realName;
    newEntity.phoneNo = data.phoneNo;
    newEntity.email = data.email;
    newEntity.companyName = data.companyName;
    newEntity.companyNo = data.companyNo || '';
    newEntity.companyPartName = data.companyPartName || '';
    newEntity.content = data.content;
    newEntity.isOptionalRequired = data.isOptionalRequired || false;

    if (user) {
      newEntity.user = user;
    }

    return await this.supportBussinessRepository.save(newEntity);
  }

  async getReceivedEmailList() {
    return await this.adminRepository.find({
      where: {
        isDeleted: false,
        role: ADMIN_ROLE.SUPER,
      },
    });
  }

  getCustomerSupportList(page: number, limit: number) {
    return this.supportCustomerRepository.findAndCount({
      take: limit,
      skip: page,
    });
  }

  getBussinessSupportList(page: number, limit: number) {
    return this.supportBussinessRepository.findAndCount({
      take: limit,
      skip: page,
    });
  }
}
