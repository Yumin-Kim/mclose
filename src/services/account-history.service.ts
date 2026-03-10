import { Injectable } from '@nestjs/common';
import { AccountHistoryRepository } from '../repositories/account-history.repository';
import { AccountHistoryEntity } from '../entities/account-history.entity';
import { ACCOUNT_CURRENCY } from '../constant';
import { UserEntity } from '../entities/user.entity';
import {
  ACCOUNT_HISTORY_LEDGER_TYPE,
  ACCOUNT_HISTORY_STATUS,
  ACCOUNT_HISTORY_TYPE,
} from '../constant';
import { QueryRunner } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';

@Injectable()
export class AccountHistoryService {
  constructor(
    private readonly accountHistoryRepository: AccountHistoryRepository,
  ) {}

  async createDepositPointHistory(
    amount: number,
    currency: string,
    accountEntity: AccountEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new AccountHistoryEntity();
    if (amount <= 0) throw new Error('Amount must be greater than 0');
    if (!accountEntity.user) throw new Error('Account must have a user');

    newEntity.currency = currency;
    newEntity.amount = amount;
    newEntity.type = ACCOUNT_HISTORY_TYPE.POINT;
    newEntity.ledgerType = ACCOUNT_HISTORY_LEDGER_TYPE.DEPOSIT;
    newEntity.status = ACCOUNT_HISTORY_STATUS.CONFIRMED;
    newEntity.user = accountEntity.user;
    newEntity.account = accountEntity;

    return queryRunner.manager.save(newEntity);
  }

  async createWithdrawPointHistory(
    amount: number,
    currency: string,
    accountEntity: AccountEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new AccountHistoryEntity();
    if (amount >= 0) throw new Error('Amount must be less than 0');
    if (!accountEntity.user) throw new Error('Account must have a user');
    newEntity.currency = currency;
    newEntity.amount = amount;
    newEntity.type = ACCOUNT_HISTORY_TYPE.POINT;
    newEntity.ledgerType = ACCOUNT_HISTORY_LEDGER_TYPE.WITHDRAW;
    newEntity.status = ACCOUNT_HISTORY_STATUS.CONFIRMED;
    newEntity.user = accountEntity.user;
    newEntity.account = accountEntity;

    return queryRunner.manager.save(newEntity);
  }

  async createDepositAssetHistory(
    amount: number,
    userEntity: UserEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new AccountHistoryEntity();
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    newEntity.amount = amount;
    newEntity.type = ACCOUNT_HISTORY_TYPE.ASSET;
    newEntity.ledgerType = ACCOUNT_HISTORY_LEDGER_TYPE.DEPOSIT;
    newEntity.status = ACCOUNT_HISTORY_STATUS.CONFIRMED;
    newEntity.currency = ACCOUNT_CURRENCY.KRW;
    newEntity.user = userEntity;

    return queryRunner.manager.save(newEntity);
  }

  async createWithdrawAssetHistory(
    amount: number,
    userEntity: UserEntity,
    queryRunner: QueryRunner,
  ) {
    const newEntity = new AccountHistoryEntity();
    if (amount >= 0) throw new Error('Amount must be less than 0');

    newEntity.amount = amount;
    newEntity.type = ACCOUNT_HISTORY_TYPE.ASSET;
    newEntity.ledgerType = ACCOUNT_HISTORY_LEDGER_TYPE.WITHDRAW;
    newEntity.status = ACCOUNT_HISTORY_STATUS.CONFIRMED;
    newEntity.currency = ACCOUNT_CURRENCY.KRW;
    newEntity.user = userEntity;

    return queryRunner.manager.save(newEntity);
  }

  async createBulkDepositPointHistory(
    values: {
      currency: string;
      amount: number;
      type: string;
      ledgerType: string;
      status: string;
      userId: number;
      accountId: number;
    }[],
    queryRunner: QueryRunner,
  ) {
    if (values.length === 0) {
      throw new Error('No data provided for bulk insert');
    }

    // 1. SQL 템플릿 준비
    const placeholders = values
      .map(
        (_, index) =>
          `(? , ? , ? , ? , ? , ? , ? , NOW(), NOW())` /* 8개의 ? */,
      )
      .join(',');

    const query = `
      INSERT INTO mc_account_history (
        currency, 
        amount, 
        type, 
        ledger_type, 
        status, 
        user_id, 
        account_id, 
        created_at, 
        updated_at
      ) VALUES ${placeholders};
    `;

    // 2. 바인딩된 파라미터 준비
    // const parameters = values.reduce((acc, value, index) => {
    //   acc[`currency${index}`] = value.currency;
    //   acc[`amount${index}`] = value.amount;
    //   acc[`type${index}`] = value.type;
    //   acc[`ledgerType${index}`] = value.ledgerType;
    //   acc[`status${index}`] = value.status;
    //   acc[`userId${index}`] = value.userId;
    //   acc[`accountId${index}`] = value.accountId;
    //   return acc;
    // }, {} as any);

    const parameters = values.flatMap((value) => [
      value.currency,
      value.amount,
      value.type,
      value.ledgerType,
      value.status,
      value.userId,
      value.accountId,
    ]);

    // 3. 쿼리 실행
    await queryRunner.query(query, parameters);
  }

  async createBulkWithdrawPointHistory(
    values: {
      amount: number; // 반드시 음수
      currency: string;
      type: string; // POINT
      ledgerType: string; // WITHDRAW
      status: string; // CONFIRMED
      userId: number;
      accountId: number;
    }[],
    queryRunner: QueryRunner,
  ) {
    // Step 1: 입력 데이터 유효성 검증
    if (values.length === 0) {
      throw new Error('No data provided for bulk insert');
    }

    // Step 2: Bulk Insert SQL 생성
    const insertValues = values
      .map(() => `(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`)
      .join(',');

    const query = `
      INSERT INTO mc_account_history (
        currency, 
        amount, 
        type, 
        ledger_type, 
        status, 
        user_id, 
        account_id, 
        created_at, 
        updated_at
      ) VALUES ${insertValues};
    `;

    // Step 3: Prepared Statement 파라미터 생성
    const parameters = values.flatMap((value) => [
      value.currency,
      value.amount,
      value.type,
      value.ledgerType,
      value.status,
      value.userId,
      value.accountId,
    ]);

    // Step 4: SQL 실행
    await queryRunner.query(query, parameters);
  }
}
