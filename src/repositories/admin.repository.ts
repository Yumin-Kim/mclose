import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { CustomRepository } from '../common/database/typeorm-respository.decorator';
import { AdminEntity } from '../entities/admin.entity';
import { SearchAdminDto } from '../dto/admin.dto';

@CustomRepository(AdminEntity)
export class AdminRepository extends Repository<AdminEntity> {
  // admin list
  async findAdminByAllList(
    searchAdminDto: SearchAdminDto,
    page: number,
    pageSize: number,
  ): Promise<[AdminEntity[], number]> {
    const whereCond: FindOptionsWhere<AdminEntity> = {};

    if (searchAdminDto.real_name) {
      whereCond.realName = Like(`%${searchAdminDto.real_name}%`);
    }

    if (searchAdminDto.email) {
      whereCond.email = Like(`%${searchAdminDto.email}%`);
    }

    if (searchAdminDto.role) {
      whereCond.role = searchAdminDto.role;
    }

    const result = await this.findAndCount({
      where: {
        ...whereCond,
      },
      order: {
        id: 'DESC',
      },
      skip: page,
      take: pageSize,
    });

    return result;
  }

  // admin entity 조회 (loginId)
  async findAdminByLoginId(loginId: string): Promise<AdminEntity> {
    return await this.findOne({ where: { loginId } });
  }

  // admin entity 조회 (id)
  async findById(id: number): Promise<AdminEntity> {
    return await this.findOne({ where: { id } });
  }
}
