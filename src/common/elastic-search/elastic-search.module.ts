import { DynamicModule, Logger, Module } from '@nestjs/common';
import { CustomElasticSearchService } from './elastic-search.service';
import { ConfigService } from '@nestjs/config';
import { IElasticSearchInitOption } from './elastic-search.interface';

@Module({})
export class ElasticSearchModule {
  // index 초기화 및 검증을 위해 작성
  static forRootAsync(options: IElasticSearchInitOption): DynamicModule {
    return {
      module: ElasticSearchModule,
      providers: [
        {
          provide: 'ELASTIC_SEARCH_MODULE_OPTIONS',
          useValue: options,
        },
        {
          provide: CustomElasticSearchService,
          useFactory: async (configService: ConfigService) => {
            const logger = new Logger(ElasticSearchModule.name);
            const customElasticSearchService = new CustomElasticSearchService(
              configService,
            );

            const indexExists =
              await customElasticSearchService.checkIndexExists(
                options.indexName,
              );

            // Check if index exists, if not, create it
            if (!indexExists) {
              let isExistEsIndex = null;

              // create index(index data)
              if (options.initialFilePath === null) {
                // Object 형태로 index 생성
                isExistEsIndex = await customElasticSearchService.createIndex(
                  options.initialIndexData,
                );
              } else {
                // file 형태로 index 생성
                isExistEsIndex = await customElasticSearchService.createIndex(
                  options.indexName,
                  options.initialFilePath,
                );
              }

              // index 생성 실패시
              if (!isExistEsIndex) {
                logger.error('ElasticSearchMoudle create index fail');
              }
            }

            //
            return customElasticSearchService;
          },
          inject: [ConfigService],
        },
      ],
      exports: [CustomElasticSearchService],
    };
  }
}
