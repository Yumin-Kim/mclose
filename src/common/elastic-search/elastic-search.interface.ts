import { IndicesCreate } from '@elastic/elasticsearch/api/requestParams';

export interface IElasticSearchInitOption {
  indexName: string;
  initialFilePath: string | null;
  initialIndexData: IndicesCreate<Record<string, any>> | null;
}

export interface IElasticSearchResponse<T> {
  total: {
    value: number;
    relation: string;
  };
  max_score: number;
  hits: IElasticSearchHitItem<T>[];
}

export interface IElasticSearchHitItem<T> {
  _index: string;
  _type: string;
  _id: string;
  _version: number;
  _source: T;
  sort?: Array<number | string>;
}
