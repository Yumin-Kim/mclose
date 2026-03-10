import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { CommonEntity } from './common.entity';

@Injectable()
export class TypeOrmCrudService<Entity extends CommonEntity> {
  constructor(private readonly repository: Repository<Entity>) {}

  async create(entity: DeepPartial<Entity>): Promise<Entity> {
    const newEntity = this.repository.create(entity);
    return (await this.repository.save(newEntity)) as Entity;
  }

  //   async update(
  //     id: number,
  //     entity: QueryDeepPartialEntity<Entity>,
  //   ): Promise<Entity> {
  //     await this.repository.update(id, entity);
  //     return await this.repository.find({
  //       select: ['*'],
  //     });
  //   }
}
