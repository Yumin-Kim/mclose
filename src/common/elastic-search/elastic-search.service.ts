import { Client } from '@elastic/elasticsearch';
import { IndicesCreate } from '@elastic/elasticsearch/api/requestParams';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs/promises';
import { IElasticSearchResponse } from './elastic-search.interface';

@Injectable()
export class CustomElasticSearchService {
  private esClient: Client;
  private esUrl: string;
  private readonly logger = new Logger(CustomElasticSearchService.name);
  constructor(private readonly configService: ConfigService) {
    const env = process.env.NODE_ENV || 'development';

    if (env != 'development') {
      this.esUrl = this.configService.get<string>('PROD_ELASTICSEARCH_URL');
    } else {
      this.esUrl = this.configService.get<string>('DEV_ELASTICSEARCH_URL');
    }

    this.init();
  }

  /**
   * init elastic search client
   * config spec : https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/basic-config.html
   * @returns
   */
  private async init() {
    try {
      if (this.esClient) {
        this.logger.log('ElasticSearch is already ready');
        return;
      }

      const client = new Client({
        node: this.esUrl,
        pingTimeout: 1000,
        sniffOnConnectionFault: true,
        sniffEndpoint: '_nodes/_all/http',
        resurrectStrategy: 'ping',
        requestTimeout: 1000 * 60 * 5,
        maxRetries: 10,
      });

      // ping check

      await this.checkReady(client);

      this.esClient = client;

      this.logger.log('ElasticSearch is ready');
    } catch (error) {
      this.logger.error("ElasticSearch isn't ready");
      this.logger.error(error);
      console.log(error);

      return null;
    }
  }

  async checkReady(client: Client) {
    try {
      return new Promise((resolve, reject) => {
        client.ping(
          {
            error_trace: true,
          },
          (error) => {
            if (error) {
              this.logger.error('ElasticSearch ping fail');
              this.logger.error(error);
              reject(false);
            } else {
              this.logger.log('ElasticSearch ping success');
              resolve(true);
            }
          },
        );
      });
    } catch (error) {
      this.logger.error('ElasticSearch ping fail');

      return null;
    }
  }

  /**
   * check index exists
   * @param indexName search index
   * @returns
   */
  async checkIndexExists(indexName: string): Promise<boolean> {
    try {
      const indexExistsUrl = `${this.esUrl}/${indexName}`;

      const response = await axios.head(indexExistsUrl);

      if (response.status !== 200) {
        this.logger.warn('ElasticSearch check index exists fail');
        return false;
      }

      this.logger.log('ElasticSearch check index exists success');

      return true;
    } catch (error) {
      this.logger.warn('ElasticSearch check index exists fail');
      return false;
    }
  }

  /**
   * create index
   * @param indexInfo indexName or createIndexData
   * @param initialFilePath default null (if you want to create index with initial data, set initialFilePath)
   * @returns
   */
  async createIndex(
    indexInfo: string | IndicesCreate<Record<string, any>>,
    initialFilePath: null | string = null,
  ) {
    try {
      let createIndexData = indexInfo;

      if (!this.esClient) {
        await this.init();
      }

      // 파일을 통한 Index 생성
      if (initialFilePath) {
        const initFile = await fs.readFile(initialFilePath, 'utf-8');
        const initialData = JSON.parse(initFile.toString());

        createIndexData = {
          index: indexInfo as string,
          body: initialData,
        };
      }

      const result = await this.esClient.indices.create(
        createIndexData as IndicesCreate<Record<string, any>>,
      );

      this.logger.log('ElasticSearch create index success');

      return result;
    } catch (error) {
      this.logger.error('ElasticSearch create index fail');
      this.logger.error(error);

      return null;
    }
  }

  /**
   * insert document
   * @param id document id
   * @param index search index
   * @param document document data
   * @returns
   */
  async insertDoc<T>(id: string, index: string, document: T) {
    try {
      if (!this.esClient) {
        await this.init();
      }
      const insertResult = await this.esClient.index({
        index,
        id,
        body: document,
      });

      this.logger.log('ElasticSearch insert document success');
      if (insertResult.statusCode != 201) {
        throw new Error('ElasticSearch insert document fail');
      }

      return insertResult.body;
    } catch (error) {
      this.logger.error('ElasticSearch insert document fail');
      this.logger.error(error);

      return null;
    }
  }

  /**
   * search document
   * @param index search index
   * @param query search query
   * @returns
   */
  async search<T>(
    index: string,
    query: Record<string, any>,
  ): Promise<IElasticSearchResponse<T>> {
    try {
      const result = await this.esClient.search({
        index,
        body: query,
      });

      if (result.statusCode != 200) {
        throw new Error('ElasticSearch search document fail');
      }

      this.logger.log('ElasticSearch search document success');

      return result.body.hits as IElasticSearchResponse<T>;
    } catch (error) {
      console.log(error);

      this.logger.error('ElasticSearch search document fail');
      this.logger.error(error);

      return null;
    }
  }

  /**
   * batch insert
   * see https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
   * @param index search index
   * @param idList document id list
   * @param documents document list
   * @returns
   */
  async bulkInsert(index: string, idList: string[], documents: any[]) {
    try {
      if (!this.esClient) {
        this.logger.warn('ElasticSearch is not ready');
        await this.init();
      }

      const body = documents.flatMap((doc, idx) => {
        return [{ index: { _index: index, _id: idList[idx] } }, doc];
      });

      const { body: bulkResponse } = await this.esClient.bulk({
        refresh: true,
        body,
      });

      if (bulkResponse.errors) {
        const erroredDocuments: any[] = [];
        bulkResponse.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: body[i * 2],
              document: body[i * 2 + 1],
            });
          }
        });
      }

      const { body: count } = await this.esClient.count({ index });

      this.logger.log('ElasticSearch bulk insert document success');

      return count;
    } catch (error) {
      this.logger.error('ElasticSearch bulk insert document fail');
      this.logger.error(error);

      return null;
    }
  }

  /**
   * bulk delete document
   * see https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_deletebyquery
   * @param index search index
   * @param matchFieldQuery { doc_field_name: value }
   * @returns
   */
  async bulkDeleteDoc(index: string, matchFieldQuery: Record<string, any>) {
    try {
      if (!this.esClient) {
        this.logger.warn('ElasticSearch is not ready');
        await this.init();
      }

      const result = await this.esClient.deleteByQuery({
        index,
        body: {
          query: {
            match: matchFieldQuery,
          },
        },
      });

      this.logger.log('ElasticSearch bulk delete document success');

      return result;
    } catch (error) {
      this.logger.error('ElasticSearch bulk delete document fail');
      this.logger.error(error);

      return null;
    }
  }

  /**
   * delete document
   * @param index search index
   * @param id document id
   * @returns
   */
  async deleteDoc(index: string, id: string) {
    try {
      if (!this.esClient) {
        this.logger.warn('ElasticSearch is not ready');
        await this.init();
      }

      const result = await this.esClient.delete({
        index,
        id,
      });

      this.logger.log('ElasticSearch delete document success');

      return result;
    } catch (error) {
      this.logger.error('ElasticSearch delete document fail');
      this.logger.error(error);

      return null;
    }
  }
}
