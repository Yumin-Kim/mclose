import { DynamicModule, Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TYPEORM_EX_CUSTOM_REPOSITORY } from './typeorm-respository.decorator';

// spec : https://velog.io/@from_numpy/Nest-Custom-Repository-%EC%83%9D%EC%84%B1%EB%B6%80%ED%84%B0-%EC%A0%81%EC%9A%A9%EA%B9%8C%EC%A7%80-feat.-%ED%9A%8C%EC%9B%90%EA%B0%80%EC%9E%85-%EC%9D%B8%EC%A6%9D
export class TypeOrmDynamicModule {
  public static forCustomRepository<T extends new (...args: any[]) => any>(
    repositories: T[],
  ): DynamicModule {
    const providers: Provider[] = [];

    for (const repository of repositories) {
      const entity = Reflect.getMetadata(
        TYPEORM_EX_CUSTOM_REPOSITORY,
        repository,
      );

      if (!entity) {
        continue;
      }

      providers.push({
        inject: [getDataSourceToken()],
        provide: repository,
        useFactory: (dataSource: DataSource): typeof repository => {
          const baseRepository = dataSource.getRepository<any>(entity);
          return new repository(
            baseRepository.target,
            baseRepository.manager,
            baseRepository.queryRunner,
          );
        },
      });
    }

    return {
      exports: providers,
      module: TypeOrmDynamicModule,
      providers,
    };
  }
}
