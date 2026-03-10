/**
 * @description: account 관련 메소드 정의 실질적으로 USECASE에 해당하는 메소드는 정의 되어 있지 않음
 */
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AccountHistoryRepository } from '../repositories/account-history.repository';
import { AccountHistoryEntity } from '../entities/account-history.entity';
import {
  ACCOUNT_CURRENCY,
  ACCOUNT_HISTORY_TYPE,
  RESPONSE_CODE,
} from '../constant';
import { UserEntity } from '../entities/user.entity';
import { AccountEntity } from '../entities/account.entity';
import { AccountRepository } from '../repositories/account.repository';
import {} from '../constant';
import { In, QueryRunner } from 'typeorm';
import { ApiHttpException } from '../common/response/response-exception.filter';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly accountRepository: AccountRepository) {}

  async create(
    currency: string,
    userEntity: UserEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new AccountEntity();
    newEntity.currency = currency;
    newEntity.balance = 0;
    newEntity.user = userEntity;

    return queryRunner.manager.save(newEntity);
  }

  async getEntityByUserAndCurrency(
    userId: number,
    currency: string,
    queryRunner: QueryRunner | null = null,
  ) {
    if (queryRunner) {
      return queryRunner.manager.findOne(AccountEntity, {
        relations: ['user'],
        where: {
          user: { id: userId },
          currency,
        },
      });
    } else {
      return this.accountRepository.findOne({
        relations: ['user'],
        where: {
          user: { id: userId },
          currency,
        },
      });
    }
  }

  async getEntityListByUserAndCurrency(
    userIdList = [],
    currency: string,
    queryRunner: QueryRunner,
  ) {
    return queryRunner.manager.find(AccountEntity, {
      relations: ['user'],
      where: {
        user: { id: In(userIdList) },
        currency,
      },
    });
  }

  async isInSufficientBalance(
    balance: number,
    currency: string,
    userId: number,
    queryRunner: QueryRunner | null = null,
  ) {
    if (queryRunner) {
      const account = await queryRunner.manager.findOne(AccountEntity, {
        where: {
          user: {
            id: userId,
          },
          currency,
        },
      });

      if (!account)
        throw new ApiHttpException(
          RESPONSE_CODE.ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );

      return account.balance < balance;
    } else {
      const account = await this.accountRepository.findOne({
        where: {
          user: {
            id: userId,
          },
          currency,
        },
      });

      if (!account)
        throw new ApiHttpException(
          RESPONSE_CODE.ACCOUNT_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );

      return account.balance < balance;
    }
  }

  async increaseBalance(
    id: number,
    balance: number,
    currency: string,
    userId: number,
    queryRunner: QueryRunner,
  ) {
    if (balance <= 0)
      throw new ApiHttpException(
        RESPONSE_CODE.ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );

    return queryRunner.manager.increment(
      AccountEntity,
      {
        id,
        currency,
        user: {
          id: userId,
        },
      },
      'balance',
      balance,
    );
  }

  async decreaseBalance(
    id: number,
    balance: number,
    currency: string,
    userId: number,
    queryRunner: QueryRunner,
  ) {
    if (balance <= 0)
      throw new ApiHttpException(
        RESPONSE_CODE.ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );

    return queryRunner.manager.decrement(
      AccountEntity,
      { id, currency, user: { id: userId } },
      'balance',
      balance,
    );
  }

  private buildCaseQueryAndParams(
    accounts: {
      id: number;
      balance: number;
      currency: string;
      userId: number;
    }[],
    operation: 'increase' | 'decrease',
  ) {
    const caseQuery = accounts
      .map(
        (account, index) => `
          WHEN id = ? AND currency = ? AND user_id = ?
          THEN balance ${operation === 'increase' ? '+' : '-'} ?`,
      )
      .join(' ');

    const params = accounts.flatMap((account) => [
      account.id,
      account.currency,
      account.userId,
      account.balance,
    ]);

    const ids = accounts.map((account) => account.id).join(', ');

    return { caseQuery, params, ids };
  }

  async bulkIncreaseBalance(
    accounts: {
      id: number;
      balance: number;
      currency: string;
      userId: number;
    }[],
    queryRunner: QueryRunner,
  ) {
    // 1. 유효성 검사
    if (accounts.some((account) => account.balance <= 0)) {
      throw new ApiHttpException(
        RESPONSE_CODE.ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. CASE 문 및 파라미터 생성
    const { caseQuery, params, ids } = this.buildCaseQueryAndParams(
      accounts,
      'increase',
    );

    // 3. SQL 생성
    const query = `
      UPDATE mc_account
      SET balance = CASE ${caseQuery} END
      WHERE id IN (${ids});
    `;

    // 4. 쿼리 실행
    await queryRunner.query(query, params);
  }

  async bulkDecreaseBalance(
    accounts: {
      id: number;
      balance: number;
      currency: string;
      userId: number;
    }[],
    queryRunner: QueryRunner,
  ) {
    // 1. 유효성 검사
    if (accounts.some((account) => account.balance <= 0)) {
      throw new ApiHttpException(
        RESPONSE_CODE.ACCOUNT_GREATER_THAN_ZERO,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. CASE 문 및 파라미터 생성
    const { caseQuery, params, ids } = this.buildCaseQueryAndParams(
      accounts,
      'decrease',
    );

    // 3. SQL 생성
    const query = `
      UPDATE mc_account
      SET balance = CASE ${caseQuery} END
      WHERE id IN (${ids});
    `;

    // 4. 쿼리 실행
    await queryRunner.query(query, params);
  }
}
