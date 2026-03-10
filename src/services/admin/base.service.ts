import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { catchError, concatMap, from, map } from 'rxjs';
import { ApiHttpException } from '../../common/response/response-exception.filter';
import { Repository } from 'typeorm';

@Injectable()
export class BaseService {
  private logger = new Logger(BaseService.name);
  constructor() {}

  create(newEntity: any, repository: Repository<any>) {
    if (!newEntity.isUsed) {
      return from(repository.save(newEntity)).pipe(
        catchError((error) => {
          this.logger.error(error);
          throw new ApiHttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
        map((entity) => {
          return entity;
        }),
      );
    } else {
      const updateWhere = {
        isUsed: true,
      };

      if (newEntity.category) {
        updateWhere['category'] = newEntity.category;
      }

      return from(
        repository.update(updateWhere, { isUsed: false, isUsedDated: null }),
      ).pipe(
        catchError((error) => {
          this.logger.error(error);
          throw new ApiHttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
        concatMap(() => {
          return from(repository.save(newEntity)).pipe(
            catchError((error) => {
              this.logger.error(error);
              throw new ApiHttpException(
                error.message,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
            map((entity) => {
              return entity;
            }),
          );
        }),
      );
    }
  }

  update(entity: any, repository: Repository<any>) {
    if (!entity.isUsed) {
      return from(repository.save(entity)).pipe(
        catchError((error) => {
          this.logger.error(error);
          throw new ApiHttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
        map((entity) => {
          return entity;
        }),
      );
    } else {
      const updateWhere = {
        isUsed: true,
      };

      if (entity.category) {
        updateWhere['category'] = entity.category;
      }
      if (entity.subCategory) {
        updateWhere['subCategory'] = entity.subCategory;
      }

      return from(
        repository.update(updateWhere, { isUsed: false, isUsedDated: null }),
      ).pipe(
        catchError((error) => {
          this.logger.error(error);
          throw new ApiHttpException(
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
        concatMap(() => {
          return from(repository.save(entity)).pipe(
            catchError((error) => {
              this.logger.error(error);
              throw new ApiHttpException(
                error.message,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
            map((entity) => {
              return entity;
            }),
          );
        }),
      );
    }
  }
}
